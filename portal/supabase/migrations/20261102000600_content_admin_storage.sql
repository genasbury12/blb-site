-- The BOSS Business System
-- Migration 0600: content management, private storage buckets, coach suggestions, automatic audit trail.
-- Decisions: D14 (admin publishes, coach suggests, published only, captions required), D15 (private storage,
-- 5 minute signed links, type and size validation, audit logs for admin actions), Phase 2 lesson experience.

-- Lesson fields from the Phase 2 lesson experience: external AI assistant prompt and path specific callouts.
alter table public.lessons
  add column ai_prompt text check (ai_prompt is null or char_length(ai_prompt) <= 4000),
  add column ai_assistant_url text check (ai_assistant_url is null or ai_assistant_url ~ '^https://'),
  add column path_note_build text check (path_note_build is null or char_length(path_note_build) <= 2000),
  add column path_note_optimize text check (path_note_optimize is null or char_length(path_note_optimize) <= 2000);

alter table public.lesson_resources
  add column file_name text,
  add column size_bytes int check (size_bytes is null or size_bytes between 1 and 26214400),
  add column created_by uuid references auth.users (id) on delete set null;

-- Private buckets (Supabase only; skipped where the storage schema does not exist, such as CI Postgres).
-- No storage.objects policies are created: objects are reachable only through 5 minute signed URLs that
-- server code issues after checking the member may see the parent record.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
      ('lesson-resources', 'lesson-resources', false, 26214400,
        array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/plain']),
      ('student-evidence', 'student-evidence', false, 10485760,
        array['application/pdf','image/png','image/jpeg','image/webp','text/plain']),
      ('feedback-files', 'feedback-files', false, 26214400,
        array['application/pdf','image/png','image/jpeg','image/webp',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain']),
      ('elite-files', 'elite-files', false, 26214400,
        array['application/pdf','image/png','image/jpeg','image/webp',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/plain'])
    on conflict (id) do nothing;
  end if;
end $$;

-- Coaches suggest edits; only admins publish (D14).
create table public.content_suggestions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 3 and 4000),
  status text not null default 'open' check (status in ('open', 'accepted', 'declined')),
  resolved_by uuid references auth.users (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.content_suggestions enable row level security;
create policy "staff read suggestions" on public.content_suggestions
  for select to authenticated using (app.is_admin() or author_id = auth.uid());
create policy "coaches and admins suggest" on public.content_suggestions
  for insert to authenticated
  with check (author_id = auth.uid() and (app.is_admin() or app.has_role('coach'::public.staff_role, auth.uid())));
create policy "admins resolve suggestions" on public.content_suggestions
  for update to authenticated using (app.is_admin()) with check (app.is_admin());

-- Automatic audit trail for staff changes made through the API (D15).
create or replace function app.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id text;
  v_changed jsonb;
begin
  if auth.uid() is null then
    return coalesce(new, old); -- service role and migrations log explicitly where relevant
  end if;
  v_id := coalesce(to_jsonb(new) ->> 'id', to_jsonb(old) ->> 'id', to_jsonb(new) ->> 'user_id', to_jsonb(old) ->> 'user_id');
  if tg_op = 'UPDATE' then
    select coalesce(jsonb_object_agg(n.key, jsonb_build_object('from', o.value, 'to', n.value)), '{}'::jsonb)
      into v_changed
      from jsonb_each(to_jsonb(new)) n
      join jsonb_each(to_jsonb(old)) o using (key)
     where n.value is distinct from o.value and n.key not in ('updated_at', 'transcript');
  elsif tg_op = 'INSERT' then
    v_changed := jsonb_build_object('created', true);
  else
    v_changed := jsonb_build_object('deleted', true);
  end if;
  insert into public.admin_audit_log (actor_id, action, entity_type, entity_id, changed_fields)
  values (auth.uid(), lower(tg_table_name || '.' || tg_op), tg_table_name, v_id, v_changed);
  return coalesce(new, old);
end;
$$;

create trigger modules_audit after insert or update or delete on public.modules for each row execute function app.audit_row_change();
create trigger lessons_audit after insert or update or delete on public.lessons for each row execute function app.audit_row_change();
create trigger lesson_resources_audit after insert or update or delete on public.lesson_resources for each row execute function app.audit_row_change();
create trigger milestones_audit after insert or update or delete on public.milestones for each row execute function app.audit_row_change();
create trigger coach_assignments_audit after insert or update or delete on public.coach_assignments for each row execute function app.audit_row_change();
create trigger prices_audit after insert or update or delete on public.prices for each row execute function app.audit_row_change();

-- Admins may attach Stripe price IDs per environment (D05) but never change approved amounts here.
create policy "admins set stripe price ids" on public.prices
  for update to authenticated using (app.is_admin()) with check (app.is_admin());
create or replace function app.guard_price_amounts()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_setting('role', true) = 'authenticated' and (
       new.amount_cents <> old.amount_cents or new.sku <> old.sku or new.plan <> old.plan
       or new.installment_count <> old.installment_count or new.currency <> old.currency) then
    raise exception 'Approved prices can only change through a reviewed migration (D04)' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger prices_guard before update on public.prices for each row execute function app.guard_price_amounts();
