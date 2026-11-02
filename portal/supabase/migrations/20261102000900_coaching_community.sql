-- The BOSS Business System
-- Migration 0900: coaching hub, replays, workshops, Hot Seat, feedback quota, community.
-- Decisions: D10 community, D11 feedback, D12 coaching calendar, D15 privacy. Blueprint: replays only
-- during active coaching; Hot Seat explicit recording consent; Blueprint has no paid support.

create or replace function app.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$ select app.is_admin() or app.has_role('coach'::public.staff_role, auth.uid()); $$;

-- Published US holidays used for business day targets (D11). Admin managed.
create table public.business_holidays (
  holiday date primary key,
  name text not null check (char_length(name) between 2 and 80)
);
alter table public.business_holidays enable row level security;
create policy "members read holidays" on public.business_holidays for select to authenticated using (true);
create policy "admins manage holidays" on public.business_holidays for all to authenticated using (app.is_admin()) with check (app.is_admin());

-- ---------------------------------------------------------------------------
-- Coaching sessions and replays
-- ---------------------------------------------------------------------------
create type public.session_kind as enum ('group', 'hot_seat');
create type public.session_status as enum ('scheduled', 'canceled', 'completed');

create table public.coaching_sessions (
  id uuid primary key default gen_random_uuid(),
  kind public.session_kind not null,
  title text not null check (char_length(title) between 3 and 140),
  agenda text check (agenda is null or char_length(agenda) <= 4000),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  meeting_url_private text check (meeting_url_private is null or meeting_url_private ~ '^https://'),
  recording_url_private text check (recording_url_private is null or recording_url_private ~ '^https://'),
  recording_playback_id text check (recording_playback_id is null or recording_playback_id ~ '^[A-Za-z0-9]{10,80}$'),
  status public.session_status not null default 'scheduled',
  cancel_note text,
  published boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  unique (kind, starts_at)
);
create index coaching_sessions_start_idx on public.coaching_sessions (starts_at);
alter table public.coaching_sessions enable row level security;
create trigger coaching_sessions_touch before update on public.coaching_sessions for each row execute function app.touch_updated_at();
create trigger coaching_sessions_audit after insert or update or delete on public.coaching_sessions for each row execute function app.audit_row_change();

create policy "coaching members read published sessions" on public.coaching_sessions for select to authenticated
  using (published and app.has_feature('group_coaching.access'::public.feature_key, auth.uid(), now()));
create policy "staff read sessions" on public.coaching_sessions for select to authenticated using (app.is_staff());
create policy "staff manage sessions" on public.coaching_sessions for all to authenticated using (app.is_staff()) with check (app.is_staff());

create table public.coaching_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.coaching_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 3 and 1500),
  created_at timestamptz not null default now()
);
create index coaching_questions_session_idx on public.coaching_questions (session_id);
alter table public.coaching_questions enable row level security;
create policy "read own questions" on public.coaching_questions for select to authenticated using (user_id = auth.uid());
create policy "staff read questions" on public.coaching_questions for select to authenticated using (app.is_staff());
create policy "ask before a published upcoming session" on public.coaching_questions for insert to authenticated
  with check (
    user_id = auth.uid()
    and app.has_feature('group_coaching.access'::public.feature_key, auth.uid(), now())
    and exists (select 1 from public.coaching_sessions s where s.id = session_id and s.published and s.status = 'scheduled' and s.starts_at > now())
  );
create policy "remove own question" on public.coaching_questions for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Workshops (two prerecorded per month, first and third Monday; D12)
-- ---------------------------------------------------------------------------
create table public.workshops (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,80}$'),
  title text not null check (char_length(title) between 3 and 140),
  description text check (description is null or char_length(description) <= 4000),
  release_at timestamptz not null,
  video_provider_id text check (video_provider_id is null or video_provider_id ~ '^[A-Za-z0-9]{10,80}$'),
  captions_ready boolean not null default false,
  transcript text,
  duration_seconds int check (duration_seconds is null or duration_seconds between 60 and 14400),
  is_sample boolean not null default false,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not is_sample or title like 'SAMPLE:%')
);
alter table public.workshops enable row level security;
create trigger workshops_touch before update on public.workshops for each row execute function app.touch_updated_at();
create trigger workshops_audit after insert or update or delete on public.workshops for each row execute function app.audit_row_change();
create trigger workshops_publish_guard before insert or update on public.workshops for each row execute function app.guard_lesson_publish();

create policy "coaching members read released workshops" on public.workshops for select to authenticated
  using (status = 'published' and release_at <= now() and app.has_feature('workshops.access'::public.feature_key, auth.uid(), now()));
create policy "staff read workshops" on public.workshops for select to authenticated using (app.is_staff());
create policy "admins manage workshops" on public.workshops for all to authenticated using (app.is_admin()) with check (app.is_admin());

-- ---------------------------------------------------------------------------
-- Hot Seat applications (D12; blueprint: consent, carry forward, edit or withdraw)
-- ---------------------------------------------------------------------------
create type public.hotseat_status as enum ('submitted', 'selected', 'not_selected', 'carried_forward', 'withdrawn');

-- Applications close at 1 PM America/New_York on the first Tuesday of the target month.
create or replace function app.hotseat_close(p_month date)
returns timestamptz
language sql
immutable
set search_path = ''
as $$
  select ((date_trunc('month', p_month)::date
           + ((2 - extract(dow from date_trunc('month', p_month))::int + 7) % 7))::timestamp
          + time '13:00') at time zone 'America/New_York';
$$;

create table public.hotseat_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  target_month date not null check (target_month = date_trunc('month', target_month)::date),
  topic text not null check (char_length(topic) between 3 and 200),
  details text not null check (char_length(details) between 10 and 4000),
  redaction_requests text check (redaction_requests is null or char_length(redaction_requests) <= 1000),
  recording_consent boolean not null check (recording_consent),
  consent_text_version text not null,
  status public.hotseat_status not null default 'submitted',
  carried_from uuid references public.hotseat_applications (id) on delete set null,
  decision_note text,
  decided_by uuid references auth.users (id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index hotseat_one_active_per_month on public.hotseat_applications (user_id, target_month) where status <> 'withdrawn';
alter table public.hotseat_applications enable row level security;
create trigger hotseat_touch before update on public.hotseat_applications for each row execute function app.touch_updated_at();

create or replace function app.guard_hotseat()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_setting('role', true) <> 'authenticated' or app.is_staff() then
    return new;
  end if;
  if now() >= app.hotseat_close(new.target_month) then
    raise exception 'Applications for that Hot Seat are closed' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' then
    if old.status <> 'submitted' then
      raise exception 'This application has already been decided' using errcode = '42501';
    end if;
    if new.status not in ('submitted', 'withdrawn') or new.decision_note is distinct from old.decision_note
       or new.decided_by is distinct from old.decided_by or new.user_id <> old.user_id or new.target_month <> old.target_month then
      raise exception 'Members can edit or withdraw their own application only' using errcode = '42501';
    end if;
  elsif new.status <> 'submitted' or new.decided_by is not null then
    raise exception 'New applications start as submitted' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger hotseat_guard before insert or update on public.hotseat_applications for each row execute function app.guard_hotseat();

create policy "read own hot seat applications" on public.hotseat_applications for select to authenticated using (user_id = auth.uid());
create policy "staff read hot seat applications" on public.hotseat_applications for select to authenticated using (app.is_staff());
create policy "apply for hot seat" on public.hotseat_applications for insert to authenticated
  with check (user_id = auth.uid() and app.has_feature('hotseat.apply'::public.feature_key, auth.uid(), now()));
create policy "edit own hot seat application" on public.hotseat_applications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "staff decide hot seat" on public.hotseat_applications for update to authenticated using (app.is_staff()) with check (app.is_staff());

-- Carry an unselected application into the next month (staff only).
create or replace function public.staff_carry_forward_hotseat(p_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  a public.hotseat_applications%rowtype;
  v_new uuid;
begin
  if not app.is_staff() then raise exception 'staff only' using errcode = '42501'; end if;
  select * into a from public.hotseat_applications where id = p_id for update;
  if not found then raise exception 'not found'; end if;
  update public.hotseat_applications set status = 'carried_forward', decided_by = auth.uid(), decided_at = now() where id = p_id;
  insert into public.hotseat_applications (user_id, target_month, topic, details, redaction_requests, recording_consent, consent_text_version, carried_from)
  values (a.user_id, (a.target_month + interval '1 month')::date, a.topic, a.details, a.redaction_requests, a.recording_consent, a.consent_text_version, a.id)
  on conflict (user_id, target_month) where status <> 'withdrawn' do nothing
  returning id into v_new;
  return v_new;
end;
$$;
revoke execute on function public.staff_carry_forward_hotseat(uuid) from public, anon;
grant execute on function public.staff_carry_forward_hotseat(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Feedback (D11): two per monthly cycle from coaching activation, no rollover, server enforced.
-- ---------------------------------------------------------------------------
create or replace function app.feedback_cycle_start(p_user uuid, p_at timestamptz)
returns timestamptz
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_activation timestamptz;
  v_local timestamp;
  n int := 0;
begin
  select max(e.starts_at) into v_activation
    from public.entitlements e
   where e.user_id = p_user and e.feature_key = 'feedback.submit' and e.state = 'active'
     and e.starts_at <= p_at and (e.ends_at is null or p_at < e.ends_at);
  if v_activation is null then return null; end if;
  v_local := v_activation at time zone 'America/New_York';
  while ((v_local + make_interval(months => n + 1)) at time zone 'America/New_York') <= p_at and n < 120 loop
    n := n + 1;
  end loop;
  return (v_local + make_interval(months => n)) at time zone 'America/New_York';
end;
$$;

create type public.feedback_state as enum ('submitted', 'in_review', 'responded', 'withdrawn');

create table public.feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  cycle_start timestamptz not null,
  deliverable_title text not null check (char_length(deliverable_title) between 3 and 140),
  description text not null check (char_length(description) between 10 and 4000),
  link_url text check (link_url is null or link_url ~ '^https://'),
  file_key text,
  file_mime text,
  state public.feedback_state not null default 'submitted',
  response_due_at timestamptz not null,
  response_text text check (response_text is null or char_length(response_text) <= 10000),
  response_video_url text check (response_video_url is null or response_video_url ~ '^https://'),
  responder_id uuid references auth.users (id) on delete set null,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index feedback_user_cycle_idx on public.feedback_submissions (user_id, cycle_start);
create index feedback_due_idx on public.feedback_submissions (state, response_due_at);
alter table public.feedback_submissions enable row level security;
create trigger feedback_touch before update on public.feedback_submissions for each row execute function app.touch_updated_at();

create or replace function app.guard_feedback()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_cycle timestamptz;
  v_used int;
begin
  if tg_op = 'INSERT' then
    v_cycle := app.feedback_cycle_start(new.user_id, now());
    if v_cycle is null then raise exception 'No active feedback allowance' using errcode = '42501'; end if;
    perform pg_advisory_xact_lock(hashtextextended('feedback:' || new.user_id::text, 0));
    select count(*) into v_used from public.feedback_submissions
     where user_id = new.user_id and cycle_start = v_cycle and state <> 'withdrawn';
    if v_used >= 2 then
      raise exception 'Feedback quota reached: two submissions per monthly cycle' using errcode = '23514';
    end if;
    new.cycle_start := v_cycle;
    new.state := 'submitted';
    new.response_text := null; new.responder_id := null; new.responded_at := null; new.response_video_url := null;
    return new;
  end if;
  -- Members may only withdraw a submission nobody has started on.
  if current_setting('role', true) = 'authenticated' and not app.is_staff() then
    if new.state <> 'withdrawn' or old.state <> 'submitted'
       or new.deliverable_title <> old.deliverable_title or new.description <> old.description
       or new.response_text is distinct from old.response_text or new.cycle_start <> old.cycle_start then
      raise exception 'You can withdraw a submission before review starts; other changes are not allowed' using errcode = '42501';
    end if;
  end if;
  if new.state = 'responded' and old.state <> 'responded' then
    new.responded_at := now();
  end if;
  return new;
end;
$$;
create trigger feedback_guard before insert or update on public.feedback_submissions for each row execute function app.guard_feedback();

create policy "read own feedback" on public.feedback_submissions for select to authenticated using (user_id = auth.uid());
create policy "admins read feedback" on public.feedback_submissions for select to authenticated using (app.is_admin());
create policy "assigned coach reads feedback" on public.feedback_submissions for select to authenticated using (app.is_assigned_coach(user_id));
create policy "submit feedback" on public.feedback_submissions for insert to authenticated
  with check (user_id = auth.uid() and app.has_feature('feedback.submit'::public.feature_key, auth.uid(), now()));
create policy "withdraw own feedback" on public.feedback_submissions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "staff respond to feedback" on public.feedback_submissions for update to authenticated
  using (app.is_admin() or app.is_assigned_coach(user_id)) with check (app.is_admin() or app.is_assigned_coach(user_id));

create or replace function public.my_feedback_cycle()
returns table (cycle_start timestamptz, used int)
language sql
stable
security definer
set search_path = ''
as $$
  with c as (select app.feedback_cycle_start(auth.uid(), now()) as cs)
  select c.cs, (select count(*)::int from public.feedback_submissions f where f.user_id = auth.uid() and f.cycle_start = c.cs and f.state <> 'withdrawn')
  from c;
$$;
revoke execute on function public.my_feedback_cycle() from public, anon;
grant execute on function public.my_feedback_cycle() to authenticated;

-- ---------------------------------------------------------------------------
-- Community (D10): posts, threaded comments, reports, moderation, rate limits. No DMs, no emails shown.
-- ---------------------------------------------------------------------------
create type public.moderation_status as enum ('visible', 'hidden', 'removed');

create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 140),
  body text not null check (char_length(body) between 3 and 5000),
  tag text check (tag is null or tag in ('win', 'question', 'resource', 'announcement')),
  pinned boolean not null default false,
  moderation_status public.moderation_status not null default 'visible',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index community_posts_feed_idx on public.community_posts (pinned desc, created_at desc);
alter table public.community_posts enable row level security;
create trigger community_posts_touch before update on public.community_posts for each row execute function app.touch_updated_at();

create table public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  parent_comment_id uuid references public.community_comments (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 3000),
  moderation_status public.moderation_status not null default 'visible',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index community_comments_post_idx on public.community_comments (post_id, created_at);
alter table public.community_comments enable row level security;
create trigger community_comments_touch before update on public.community_comments for each row execute function app.touch_updated_at();

create table public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  post_id uuid references public.community_posts (id) on delete cascade,
  comment_id uuid references public.community_comments (id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 500),
  status text not null default 'open' check (status in ('open', 'resolved')),
  resolved_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  check ((post_id is null) <> (comment_id is null))
);
alter table public.community_reports enable row level security;

-- Basic rate limits (D10): 5 posts per hour, 30 comments per hour, 20 reports per day.
create or replace function app.guard_community_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare v_count int;
begin
  if current_setting('role', true) = 'authenticated' and not app.is_staff() then
    if tg_op = 'INSERT' then
      if tg_table_name = 'community_posts' then
        select count(*) into v_count from public.community_posts where user_id = new.user_id and created_at > now() - interval '1 hour';
        if v_count >= 5 then raise exception 'Posting limit reached. Try again in an hour.' using errcode = '54000'; end if;
        if new.pinned or new.moderation_status <> 'visible' or new.tag = 'announcement' then
          raise exception 'Only staff can pin, moderate, or post announcements' using errcode = '42501';
        end if;
      elsif tg_table_name = 'community_comments' then
        select count(*) into v_count from public.community_comments where user_id = new.user_id and created_at > now() - interval '1 hour';
        if v_count >= 30 then raise exception 'Comment limit reached. Try again in an hour.' using errcode = '54000'; end if;
        if new.moderation_status <> 'visible' then raise exception 'Only staff can moderate' using errcode = '42501'; end if;
        if new.parent_comment_id is not null and exists (
          select 1 from public.community_comments c where c.id = new.parent_comment_id and c.parent_comment_id is not null) then
          raise exception 'Replies go one level deep' using errcode = '23514';
        end if;
      end if;
    else
      if new.moderation_status is distinct from old.moderation_status or (tg_table_name = 'community_posts' and (new.pinned is distinct from old.pinned or new.tag is distinct from old.tag and new.tag = 'announcement')) then
        raise exception 'Only staff can pin or moderate' using errcode = '42501';
      end if;
    end if;
  end if;
  return new;
end;
$$;
create trigger community_posts_guard before insert or update on public.community_posts for each row execute function app.guard_community_write();
create trigger community_comments_guard before insert or update on public.community_comments for each row execute function app.guard_community_write();

create or replace function app.guard_report_rate()
returns trigger
language plpgsql
set search_path = ''
as $$
declare v_count int;
begin
  select count(*) into v_count from public.community_reports where reporter_id = new.reporter_id and created_at > now() - interval '1 day';
  if v_count >= 20 then raise exception 'Report limit reached for today' using errcode = '54000'; end if;
  return new;
end;
$$;
create trigger community_reports_rate before insert on public.community_reports for each row execute function app.guard_report_rate();

create policy "members read visible posts" on public.community_posts for select to authenticated
  using (app.has_feature('community.access'::public.feature_key, auth.uid(), now())
         and ((moderation_status = 'visible' and deleted_at is null) or user_id = auth.uid()));
create policy "staff read posts" on public.community_posts for select to authenticated using (app.is_staff());
create policy "members post" on public.community_posts for insert to authenticated
  with check (user_id = auth.uid() and app.has_feature('community.access'::public.feature_key, auth.uid(), now()));
create policy "members edit own posts" on public.community_posts for update to authenticated
  using (user_id = auth.uid() and app.has_feature('community.access'::public.feature_key, auth.uid(), now())) with check (user_id = auth.uid());
create policy "staff moderate posts" on public.community_posts for update to authenticated using (app.is_staff()) with check (app.is_staff());
create policy "staff post announcements" on public.community_posts for insert to authenticated with check (app.is_staff() and user_id = auth.uid());

create policy "members read visible comments" on public.community_comments for select to authenticated
  using (app.has_feature('community.access'::public.feature_key, auth.uid(), now())
         and ((moderation_status = 'visible' and deleted_at is null) or user_id = auth.uid())
         and exists (select 1 from public.community_posts p where p.id = post_id and p.moderation_status = 'visible' and p.deleted_at is null));
create policy "staff read comments" on public.community_comments for select to authenticated using (app.is_staff());
create policy "members comment" on public.community_comments for insert to authenticated
  with check (user_id = auth.uid() and app.has_feature('community.access'::public.feature_key, auth.uid(), now())
              and exists (select 1 from public.community_posts p where p.id = post_id and p.moderation_status = 'visible' and p.deleted_at is null));
create policy "members edit own comments" on public.community_comments for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "staff moderate comments" on public.community_comments for update to authenticated using (app.is_staff()) with check (app.is_staff());
create policy "staff comment" on public.community_comments for insert to authenticated with check (app.is_staff() and user_id = auth.uid());

create policy "members report" on public.community_reports for insert to authenticated
  with check (reporter_id = auth.uid() and app.has_feature('community.access'::public.feature_key, auth.uid(), now()));
create policy "read own reports" on public.community_reports for select to authenticated using (reporter_id = auth.uid());
create policy "staff handle reports" on public.community_reports for all to authenticated using (app.is_staff()) with check (app.is_staff());

-- Author first names for the feed, only for members who can see the community. Never emails (D10).
create or replace function public.community_authors(p_ids uuid[])
returns table (user_id uuid, display_name text, is_staff boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select p.user_id, coalesce(p.display_name, 'Member'), exists (select 1 from public.user_roles r where r.user_id = p.user_id)
  from public.profiles p
  where p.user_id = any(p_ids)
    and (app.has_feature('community.access'::public.feature_key, auth.uid(), now()) or app.is_staff())
    and (exists (select 1 from public.community_posts x where x.user_id = p.user_id)
         or exists (select 1 from public.community_comments x where x.user_id = p.user_id));
$$;
revoke execute on function public.community_authors(uuid[]) from public, anon;
grant execute on function public.community_authors(uuid[]) to authenticated;
