-- The BOSS Business System
-- Migration 0100: foundation. Helpers, profiles, roles, coach assignments, admin audit log.
-- Decisions: D09 (roles student/coach/admin, server managed admin), D15 (minimum PII, audit logs).
-- Every table has RLS enabled with deny-by-default; policies grant the minimum.

create extension if not exists pgcrypto;

create schema if not exists app;
comment on schema app is 'Security definer helpers used by RLS and server code. Not exposed through the Data API.';
grant usage on schema app to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Generic helpers
-- ---------------------------------------------------------------------------

create or replace function app.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Server managed configuration flags. Only the service role writes these.
create table public.app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.app_config enable row level security;
revoke all on public.app_config from anon, authenticated;
comment on table public.app_config is 'Server managed settings. allow_sample_content must never be true in production.';

create or replace function app.config_bool(p_key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select (c.value #>> '{}')::boolean from public.app_config c where c.key = p_key), false);
$$;

-- ---------------------------------------------------------------------------
-- Roles (D09). "student" is implicit for every account. Admin and coach are
-- granted only by the service role or an existing admin through audited code.
-- ---------------------------------------------------------------------------

create type public.staff_role as enum ('admin', 'coach');

create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.staff_role not null,
  granted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function app.has_role(p_role public.staff_role, p_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user is not null and exists (
    select 1 from public.user_roles r where r.user_id = p_user and r.role = p_role
  );
$$;

create or replace function app.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$ select app.has_role('admin'::public.staff_role, auth.uid()); $$;

create policy "read own roles" on public.user_roles
  for select to authenticated using (user_id = auth.uid());
create policy "admins read all roles" on public.user_roles
  for select to authenticated using (app.is_admin());
-- No insert/update/delete policies: no self promotion through the API.

-- Coach scope (D09): a coach sees only assigned students.
create table public.coach_assignments (
  coach_id uuid not null references auth.users (id) on delete cascade,
  student_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (coach_id, student_id),
  check (coach_id <> student_id)
);
create index coach_assignments_student_idx on public.coach_assignments (student_id);
alter table public.coach_assignments enable row level security;

create or replace function app.is_assigned_coach(p_student uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and app.has_role('coach'::public.staff_role, auth.uid())
    and exists (
      select 1 from public.coach_assignments a
      where a.coach_id = auth.uid() and a.student_id = p_student
    );
$$;

create policy "coach reads own assignments" on public.coach_assignments
  for select to authenticated using (coach_id = auth.uid());
create policy "student reads own coach" on public.coach_assignments
  for select to authenticated using (student_id = auth.uid());
create policy "admins manage assignments" on public.coach_assignments
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

-- ---------------------------------------------------------------------------
-- Profiles (D15: minimum PII. Email stays in auth.users only.)
-- ---------------------------------------------------------------------------

create type public.learning_path as enum ('build_from_scratch', 'optimize_automate');

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 1 and 80),
  timezone text not null default 'America/New_York' check (char_length(timezone) <= 64),
  onboarding_state text not null default 'new' check (onboarding_state in ('new', 'audit_started', 'audit_completed')),
  reduced_motion boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create trigger profiles_touch before update on public.profiles
  for each row execute function app.touch_updated_at();

create policy "read own profile" on public.profiles
  for select to authenticated using (user_id = auth.uid());
create policy "update own profile" on public.profiles
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "admins read profiles" on public.profiles
  for select to authenticated using (app.is_admin());
create policy "assigned coach reads profile" on public.profiles
  for select to authenticated using (app.is_assigned_coach(user_id));

-- Students may only change presentation fields; onboarding_state is server managed.
create or replace function app.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_setting('role', true) = 'authenticated' and new.onboarding_state is distinct from old.onboarding_state then
    raise exception 'onboarding_state is managed by the server' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger profiles_guard before update on public.profiles
  for each row execute function app.guard_profile_update();

-- Create a profile for every new auth user.
create or replace function app.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    nullif(left(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), 80), '')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function app.handle_new_user();

-- ---------------------------------------------------------------------------
-- Admin audit log (D07, D15). Append only.
-- ---------------------------------------------------------------------------

create table public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null check (char_length(action) between 3 and 80),
  entity_type text not null,
  entity_id text,
  changed_fields jsonb not null default '{}'::jsonb,
  reason text,
  created_at timestamptz not null default now()
);
create index admin_audit_log_entity_idx on public.admin_audit_log (entity_type, entity_id);
alter table public.admin_audit_log enable row level security;
create policy "admins read audit log" on public.admin_audit_log
  for select to authenticated using (app.is_admin());

create or replace function app.prevent_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception '% is append only', tg_table_name using errcode = '42501';
end;
$$;
create trigger admin_audit_log_append_only before update or delete on public.admin_audit_log
  for each row execute function app.prevent_mutation();

create or replace function app.log_admin_action(
  p_action text,
  p_entity_type text,
  p_entity_id text,
  p_changed jsonb default '{}'::jsonb,
  p_reason text default null
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.admin_audit_log (actor_id, action, entity_type, entity_id, changed_fields, reason)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, coalesce(p_changed, '{}'::jsonb), p_reason);
$$;
revoke execute on function app.log_admin_action(text, text, text, jsonb, text) from public, anon, authenticated;
grant execute on function app.log_admin_action(text, text, text, jsonb, text) to service_role;
