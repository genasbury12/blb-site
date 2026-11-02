-- The BOSS Business System
-- Migration 1000: Elite applications, five seat capacity, private workspace, check-ins, private sessions,
-- done for you minute ledger. Decisions: D09 (coach sees assigned clients only), D12 (weekly 60 minute
-- private sessions, 24 hour rescheduling, 12 DFY hours in a minute ledger), I-11 (hours only mode during
-- the 30 day extension), I-30 (package buckets recorded by admin), blueprint Elite rules.

-- ---------------------------------------------------------------------------
-- Applications and capacity
-- ---------------------------------------------------------------------------
create type public.elite_application_status as enum ('submitted', 'reviewing', 'discovery_scheduled', 'accepted', 'declined', 'withdrawn', 'enrolled');

create table public.elite_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  name text not null check (char_length(name) between 2 and 100),
  email text not null check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  business_url text check (business_url is null or business_url ~ '^https?://'),
  business_stage text not null check (char_length(business_stage) between 2 and 500),
  goals text not null check (char_length(goals) between 10 and 3000),
  biggest_challenge text not null check (char_length(biggest_challenge) between 10 and 3000),
  hours_per_week int check (hours_per_week between 0 and 80),
  status public.elite_application_status not null default 'submitted',
  discovery_at timestamptz,
  decision_note text,
  accepted_until timestamptz,
  decided_by uuid references auth.users (id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index elite_applications_email_idx on public.elite_applications (email);
alter table public.elite_applications enable row level security;
create trigger elite_applications_touch before update on public.elite_applications for each row execute function app.touch_updated_at();
create trigger elite_applications_audit after update on public.elite_applications for each row execute function app.audit_row_change();

create or replace function app.my_email()
returns text
language sql
stable
security definer
set search_path = ''
as $$ select lower(email) from auth.users where id = auth.uid(); $$;

create policy "applicant reads own application" on public.elite_applications for select to authenticated
  using (user_id = auth.uid() or email = app.my_email());
create policy "staff read applications" on public.elite_applications for select to authenticated using (app.is_staff());
-- Writes go through the functions below only.

-- Public application form (anonymous allowed). Rate limited per email, validated by constraints.
create or replace function public.submit_elite_application(p jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(p ->> 'email'));
  v_id uuid;
begin
  if (select count(*) from public.elite_applications where email = v_email and created_at > now() - interval '30 days') >= 2 then
    raise exception 'An application from this email is already being reviewed' using errcode = '54000';
  end if;
  if (select count(*) from public.elite_applications where created_at > now() - interval '1 hour') >= 30 then
    raise exception 'Applications are temporarily paused. Please try again later.' using errcode = '54000';
  end if;
  insert into public.elite_applications (user_id, name, email, business_url, business_stage, goals, biggest_challenge, hours_per_week)
  values (auth.uid(), trim(p ->> 'name'), v_email, nullif(trim(p ->> 'business_url'), ''), trim(p ->> 'business_stage'),
          trim(p ->> 'goals'), trim(p ->> 'biggest_challenge'), nullif(p ->> 'hours_per_week', '')::int)
  returning id into v_id;
  return v_id;
end;
$$;
revoke execute on function public.submit_elite_application(jsonb) from public;
grant execute on function public.submit_elite_application(jsonb) to anon, authenticated;

-- Seats in use: active Elite clients plus accepted applicants still holding an unexpired offer.
create or replace function app.elite_seats_used()
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select (
    select count(distinct e.user_id) from public.entitlements e
     where e.feature_key = 'elite_coaching.access' and app.has_feature('elite_coaching.access', e.user_id, now())
  )::int + (
    select count(*) from public.elite_applications a
     where a.status = 'accepted' and a.accepted_until > now()
  )::int;
$$;

create or replace function public.elite_capacity()
returns table (seats_total int, seats_used int)
language sql
stable
security definer
set search_path = ''
as $$ select 5, app.elite_seats_used() where app.is_staff(); $$;
revoke execute on function public.elite_capacity() from public, anon;
grant execute on function public.elite_capacity() to authenticated;

create or replace function public.staff_decide_elite(p_id uuid, p_status public.elite_application_status, p_note text, p_discovery_at timestamptz default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not app.is_staff() then raise exception 'staff only' using errcode = '42501'; end if;
  if p_status in ('submitted', 'enrolled') then raise exception 'invalid decision'; end if;
  perform pg_advisory_xact_lock(hashtextextended('elite-seats', 0));
  if p_status = 'accepted' and app.elite_seats_used() >= 5 then
    raise exception 'All five Elite seats are taken. Decline or wait for a seat to open.' using errcode = '23514';
  end if;
  update public.elite_applications
     set status = p_status,
         decision_note = coalesce(p_note, decision_note),
         discovery_at = coalesce(p_discovery_at, discovery_at),
         accepted_until = case when p_status = 'accepted' then now() + interval '14 days' else null end,
         decided_by = auth.uid(),
         decided_at = now()
   where id = p_id and status not in ('enrolled', 'withdrawn');
  if not found then raise exception 'application not found or already closed'; end if;
end;
$$;
revoke execute on function public.staff_decide_elite(uuid, public.elite_application_status, text, timestamptz) from public, anon;
grant execute on function public.staff_decide_elite(uuid, public.elite_application_status, text, timestamptz) to authenticated;

-- Replaces the placeholder: checkout opens only for an accepted applicant (matched by account email).
create or replace function public.my_elite_checkout_allowed()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.elite_applications a
     where a.status = 'accepted' and a.accepted_until > now()
       and (a.user_id = auth.uid() or a.email = app.my_email())
  );
$$;

-- ---------------------------------------------------------------------------
-- Workspace
-- ---------------------------------------------------------------------------
create table public.elite_boards (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references auth.users (id) on delete cascade,
  coach_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.elite_boards enable row level security;

-- 'full' = roadmap, tasks, check-ins, sessions. 'hours' = implementation requests and the hours ledger (I-11).
create or replace function app.board_access(p_board uuid, p_mode text default 'full')
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.elite_boards b
     where b.id = p_board
       and (
         app.is_admin()
         or b.coach_id = auth.uid()
         or app.is_assigned_coach(b.client_id)
         or (b.client_id = auth.uid() and (
               app.has_feature('elite_board.access', auth.uid(), now())
               or (p_mode = 'hours' and app.has_feature('elite_dfu_hours.use', auth.uid(), now()))))
       )
  );
$$;

create or replace function app.board_staff(p_board uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.elite_boards b where b.id = p_board and (app.is_admin() or b.coach_id = auth.uid() or app.is_assigned_coach(b.client_id)));
$$;

create policy "board members read board" on public.elite_boards for select to authenticated
  using (app.board_access(id, 'hours'));
create policy "admins manage boards" on public.elite_boards for all to authenticated using (app.is_admin()) with check (app.is_admin());

create type public.elite_item_kind as enum ('roadmap', 'task', 'deliverable', 'request', 'audit', 'coach_note');
create type public.elite_item_status as enum ('open', 'in_progress', 'waiting_on_client', 'done', 'submitted', 'scoped', 'completed', 'declined', 'archived');

create table public.elite_items (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.elite_boards (id) on delete cascade,
  kind public.elite_item_kind not null,
  title text not null check (char_length(title) between 2 and 200),
  body text check (body is null or char_length(body) <= 20000),
  status public.elite_item_status not null default 'open',
  priority int not null default 3 check (priority between 1 and 5),
  month_number int check (month_number between 1 and 6),
  due_on date,
  estimated_minutes int check (estimated_minutes is null or estimated_minutes between 0 and 6000),
  completion_summary text check (completion_summary is null or char_length(completion_summary) <= 4000),
  created_by uuid not null references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index elite_items_board_idx on public.elite_items (board_id, kind);
alter table public.elite_items enable row level security;
create trigger elite_items_touch before update on public.elite_items for each row execute function app.touch_updated_at();

-- Clients see shared items (never coach notes); requests stay visible in hours only mode.
create policy "client and staff read items" on public.elite_items for select to authenticated
  using (
    (app.board_staff(board_id))
    or (kind <> 'coach_note' and kind = 'request' and app.board_access(board_id, 'hours'))
    or (kind <> 'coach_note' and app.board_access(board_id, 'full'))
  );
create policy "clients add requests and tasks" on public.elite_items for insert to authenticated
  with check (
    created_by = auth.uid() and not app.board_staff(board_id)
    and ((kind = 'request' and status = 'submitted' and app.board_access(board_id, 'hours'))
      or (kind = 'task' and app.board_access(board_id, 'full')))
  );
create policy "staff manage items" on public.elite_items for all to authenticated using (app.board_staff(board_id)) with check (app.board_staff(board_id));
create policy "clients update own tasks" on public.elite_items for update to authenticated
  using (kind = 'task' and app.board_access(board_id, 'full') and not app.board_staff(board_id))
  with check (kind = 'task' and app.board_access(board_id, 'full') and not app.board_staff(board_id));

create table public.elite_item_comments (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.elite_items (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
alter table public.elite_item_comments enable row level security;
create or replace function app.item_visible(p_item uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.elite_items i
     where i.id = p_item
       and (app.board_staff(i.board_id)
            or (i.kind = 'request' and app.board_access(i.board_id, 'hours'))
            or (i.kind <> 'coach_note' and app.board_access(i.board_id, 'full')))
  );
$$;
create policy "read comments on visible items" on public.elite_item_comments for select to authenticated using (app.item_visible(item_id));
create policy "comment on visible items" on public.elite_item_comments for insert to authenticated with check (user_id = auth.uid() and app.item_visible(item_id));

-- ---------------------------------------------------------------------------
-- Private sessions (weekly 60 minutes, 24 hour rescheduling) and check-ins
-- ---------------------------------------------------------------------------
create type public.private_session_status as enum ('scheduled', 'completed', 'client_rescheduled', 'late_cancel_forfeited', 'no_show', 'coach_canceled');

create table public.elite_sessions (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.elite_boards (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  meeting_url_private text check (meeting_url_private is null or meeting_url_private ~ '^https://'),
  status public.private_session_status not null default 'scheduled',
  replaces_session_id uuid references public.elite_sessions (id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index elite_sessions_board_idx on public.elite_sessions (board_id, starts_at);
alter table public.elite_sessions enable row level security;
create policy "board reads sessions" on public.elite_sessions for select to authenticated using (app.board_access(board_id, 'full'));
create policy "staff manage sessions" on public.elite_sessions for all to authenticated using (app.board_staff(board_id)) with check (app.board_staff(board_id));

-- Client cancellation: 24 hours or more ahead is a reschedule; later is forfeited (blueprint section 8).
create or replace function public.client_cancel_private_session(p_id uuid)
returns public.private_session_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.elite_sessions%rowtype;
  v_status public.private_session_status;
begin
  select * into s from public.elite_sessions where id = p_id for update;
  if not found or not exists (select 1 from public.elite_boards b where b.id = s.board_id and b.client_id = auth.uid())
     or not app.board_access(s.board_id, 'full') then
    raise exception 'not found' using errcode = '42501';
  end if;
  if s.status <> 'scheduled' then raise exception 'This session can no longer be changed'; end if;
  v_status := case when s.starts_at - now() >= interval '24 hours' then 'client_rescheduled' else 'late_cancel_forfeited' end;
  update public.elite_sessions set status = v_status where id = p_id;
  return v_status;
end;
$$;
revoke execute on function public.client_cancel_private_session(uuid) from public, anon;
grant execute on function public.client_cancel_private_session(uuid) to authenticated;

create table public.elite_checkins (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.elite_boards (id) on delete cascade,
  session_id uuid not null references public.elite_sessions (id) on delete cascade,
  accomplishments text not null check (char_length(accomplishments) between 3 and 4000),
  challenges text not null check (char_length(challenges) between 3 and 4000),
  top_priorities text not null check (char_length(top_priorities) between 3 and 2000),
  help_needed text not null check (char_length(help_needed) between 3 and 4000),
  submitted_at timestamptz not null default now(),
  due_at timestamptz not null,
  unique (session_id)
);
alter table public.elite_checkins enable row level security;

create or replace function app.guard_checkin()
returns trigger
language plpgsql
set search_path = ''
as $$
declare s public.elite_sessions%rowtype;
begin
  select * into s from public.elite_sessions where id = new.session_id;
  if not found or s.board_id <> new.board_id then raise exception 'session does not belong to this board'; end if;
  new.due_at := s.starts_at - interval '24 hours';
  if tg_op = 'INSERT' then new.submitted_at := now(); end if;
  return new;
end;
$$;
create trigger elite_checkins_guard before insert or update on public.elite_checkins for each row execute function app.guard_checkin();

create policy "board reads checkins" on public.elite_checkins for select to authenticated using (app.board_access(board_id, 'full'));
create policy "client submits checkin" on public.elite_checkins for insert to authenticated
  with check (app.board_access(board_id, 'full') and exists (select 1 from public.elite_boards b where b.id = board_id and b.client_id = auth.uid()));
create policy "client edits checkin" on public.elite_checkins for update to authenticated
  using (exists (select 1 from public.elite_boards b where b.id = board_id and b.client_id = auth.uid()) and app.board_access(board_id, 'full'))
  with check (exists (select 1 from public.elite_boards b where b.id = board_id and b.client_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- Done for you minute ledger (D12: 12 hours tracked in minutes; I-30 packages recorded by admin)
-- ---------------------------------------------------------------------------
create table public.elite_hour_buckets (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.elite_boards (id) on delete cascade,
  kind text not null check (kind in ('included', 'package')),
  minutes_granted int not null check (minutes_granted between 1 and 6000),
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  note text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  check (expires_at > starts_at),
  check (kind <> 'package' or char_length(coalesce(note, '')) >= 5)
);
create unique index elite_one_included_bucket on public.elite_hour_buckets (board_id) where kind = 'included';
alter table public.elite_hour_buckets enable row level security;
create trigger elite_hour_buckets_audit after insert or update or delete on public.elite_hour_buckets for each row execute function app.audit_row_change();
create policy "board reads buckets" on public.elite_hour_buckets for select to authenticated using (app.board_access(board_id, 'hours'));
create policy "admins record packages" on public.elite_hour_buckets for insert to authenticated with check (app.is_admin() and kind = 'package');

create table public.elite_time_entries (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.elite_boards (id) on delete cascade,
  bucket_id uuid not null references public.elite_hour_buckets (id) on delete restrict,
  item_id uuid references public.elite_items (id) on delete set null,
  minutes int not null check (minutes between 1 and 600),
  work_date date not null,
  note text not null check (char_length(note) between 3 and 1000),
  coach_id uuid not null references auth.users (id) on delete set null,
  voided_at timestamptz,
  void_reason text,
  created_at timestamptz not null default now(),
  check (voided_at is null or char_length(coalesce(void_reason, '')) >= 5)
);
create index elite_time_entries_bucket_idx on public.elite_time_entries (bucket_id);
alter table public.elite_time_entries enable row level security;
create trigger elite_time_entries_audit after insert or update on public.elite_time_entries for each row execute function app.audit_row_change();

create or replace function app.guard_time_entry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  b public.elite_hour_buckets%rowtype;
  v_used int;
begin
  if tg_op = 'UPDATE' then
    if new.minutes <> old.minutes or new.bucket_id <> old.bucket_id or new.work_date <> old.work_date or new.board_id <> old.board_id then
      raise exception 'Time entries cannot be edited; void the entry and record a new one' using errcode = '42501';
    end if;
    if old.voided_at is not null then raise exception 'This entry is already void' using errcode = '42501'; end if;
    return new;
  end if;
  select * into b from public.elite_hour_buckets where id = new.bucket_id for update;
  if not found or b.board_id <> new.board_id then raise exception 'That allowance does not belong to this client'; end if;
  if (new.work_date::timestamp at time zone 'America/New_York') >= b.expires_at then
    raise exception 'That allowance expired before this work date' using errcode = '23514';
  end if;
  select coalesce(sum(minutes), 0) into v_used from public.elite_time_entries where bucket_id = b.id and voided_at is null;
  if v_used + new.minutes > b.minutes_granted then
    raise exception 'Not enough minutes remaining in this allowance (% of % used). Overage needs a separately purchased package.', v_used, b.minutes_granted using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger elite_time_entries_guard before insert or update on public.elite_time_entries for each row execute function app.guard_time_entry();

create policy "board reads time entries" on public.elite_time_entries for select to authenticated using (app.board_access(board_id, 'hours'));
create policy "staff record time" on public.elite_time_entries for insert to authenticated with check (app.board_staff(board_id) and coach_id = auth.uid());
create policy "admins void time" on public.elite_time_entries for update to authenticated using (app.is_admin()) with check (app.is_admin());

create or replace function public.elite_hours_summary(p_board uuid)
returns table (bucket_id uuid, kind text, minutes_granted int, minutes_used int, expires_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select b.id, b.kind, b.minutes_granted,
         coalesce((select sum(t.minutes) from public.elite_time_entries t where t.bucket_id = b.id and t.voided_at is null), 0)::int,
         b.expires_at
    from public.elite_hour_buckets b
   where b.board_id = p_board and app.board_access(p_board, 'hours')
   order by b.expires_at;
$$;
revoke execute on function public.elite_hours_summary(uuid) from public, anon;
grant execute on function public.elite_hours_summary(uuid) to authenticated;

-- Private Elite files (coach audit PDF, deliverables, client uploads).
create table public.elite_files (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.elite_boards (id) on delete cascade,
  item_id uuid references public.elite_items (id) on delete set null,
  label text not null check (char_length(label) between 2 and 140),
  storage_key text not null,
  mime_type text not null,
  uploaded_by uuid not null references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.elite_files enable row level security;
create policy "board reads files" on public.elite_files for select to authenticated
  using (case when item_id is null then app.board_access(board_id, 'full') else app.item_visible(item_id) end);

-- ---------------------------------------------------------------------------
-- Provisioning: an Elite purchase creates the workspace and the included 12 hour allowance.
-- ---------------------------------------------------------------------------
create or replace function app.on_elite_grant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare v_board uuid;
begin
  if new.feature_key = 'elite_dfu_hours.use' and new.source_type = 'order' then
    insert into public.elite_boards (client_id) values (new.user_id) on conflict (client_id) do nothing;
    select id into v_board from public.elite_boards where client_id = new.user_id;
    insert into public.elite_hour_buckets (board_id, kind, minutes_granted, starts_at, expires_at, note)
    values (v_board, 'included', 720, new.starts_at, coalesce(new.ends_at, new.starts_at + interval '7 months'), 'Included 12 hours')
    on conflict (board_id) where kind = 'included' do nothing;
    update public.elite_applications set status = 'enrolled'
     where status = 'accepted' and (user_id = new.user_id or email = (select lower(email) from auth.users where id = new.user_id));
  end if;
  return new;
end;
$$;
create trigger entitlements_elite_provision after insert on public.entitlements for each row execute function app.on_elite_grant();

create policy "staff share files" on public.elite_files for insert to authenticated
  with check (app.board_staff(board_id) and uploaded_by = auth.uid());
