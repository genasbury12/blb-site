-- The BOSS Business System
-- Migration 1900: 10_DATA_RIGHTS Slice B. Member deletion requests, admin "Delete now", 30 day automatic run.
--
-- What deletion does (erase_member_prepare, one transaction, audit logged before it changes anything):
--   * deletes the member's own data (worksheets, audit, progress, roadmap, coaching, feedback, community, Elite
--     workspace, access grants, export records, Elite applications);
--   * keeps the purchase records needed for tax and refunds (orders, order payments) with the email replaced by an
--     anonymous token and the account link removed;
--   * keeps the append only audit log, with every mention of the member's id or email replaced by the same token.
-- The server then deletes the member's stored files and the sign in account (or, for staff, blocks it) and calls
-- erase_member_finish. Staff accounts (any role, or named as actor in the audit log) are never hard deleted (owner
-- decision 2026-11-04, I-73): their data is removed, roles stripped, profile anonymized, sign in blocked.

-- ---------------------------------------------------------------------------------------------------------------
-- 1. One narrow exception to the append only rules, only inside a deletion run.
--    app.erasure_request is set (transaction local) only by erase_member_prepare below. Clients cannot use it: they
--    have no update or delete policies on these tables, so row security stops them before this trigger runs.
-- ---------------------------------------------------------------------------------------------------------------
create or replace function app.prevent_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(current_setting('app.erasure_request', true), '') <> '' then
    -- A member's own append only rows (path choices) may be deleted with the rest of their data.
    if tg_op = 'DELETE' and tg_table_name <> 'admin_audit_log' then
      return old;
    end if;
    -- Audit log entries may only have their subject anonymized: who acted, what and when never change.
    if tg_op = 'UPDATE' and tg_table_name = 'admin_audit_log' then
      if new.id = old.id and new.actor_id is not distinct from old.actor_id and new.action = old.action
         and new.entity_type = old.entity_type and new.created_at = old.created_at then
        return new;
      end if;
    end if;
  end if;
  raise exception '% is append only', tg_table_name using errcode = '42501';
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- 2. Deletion requests
-- ---------------------------------------------------------------------------------------------------------------
create table public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  -- Cleared when the account is deleted; the request row stays as the record that the deletion happened.
  user_id uuid references auth.users (id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'cancelled')),
  outcome text check (outcome in ('deleted', 'anonymized')),
  subject_token text unique check (subject_token is null or subject_token ~ '^deleted-user-[0-9a-f]{10}$'),
  requested_at timestamptz not null default now(),
  due_at timestamptz not null default (now() + interval '30 days'),
  cancelled_at timestamptz,
  processing_started_at timestamptz,
  completed_at timestamptz,
  completed_by text check (completed_by in ('admin', 'schedule')),
  completed_by_admin uuid references auth.users (id) on delete set null,
  check (status <> 'completed' or (subject_token is not null and outcome is not null and completed_at is not null)),
  check (status <> 'cancelled' or cancelled_at is not null)
);
create unique index deletion_requests_one_open_idx on public.deletion_requests (user_id) where status in ('pending', 'processing');
create index deletion_requests_due_idx on public.deletion_requests (status, due_at);
alter table public.deletion_requests enable row level security;
create policy "members read own deletion requests" on public.deletion_requests for select to authenticated using (user_id = auth.uid());
create policy "admins read deletion requests" on public.deletion_requests for select to authenticated using (app.is_admin());
-- No write policies: only the functions below write.

-- A member asks for their account and data to be deleted. Returns the open request (an existing one is reused).
create or replace function public.request_my_deletion()
returns public.deletion_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_row public.deletion_requests;
begin
  if v_user is null then raise exception 'not signed in' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtext('deletion:' || v_user::text));
  select * into v_row from public.deletion_requests where user_id = v_user and status in ('pending', 'processing');
  if found then return v_row; end if;
  insert into public.deletion_requests (user_id) values (v_user) returning * into v_row;
  -- No actor (so the member stays deletable); the request id is the subject.
  insert into public.admin_audit_log (actor_id, action, entity_type, entity_id, changed_fields)
  values (null, 'deletion.requested', 'deletion_request', v_row.id::text, jsonb_build_object('due_at', v_row.due_at));
  return v_row;
end;
$$;
revoke execute on function public.request_my_deletion() from public, anon;
grant execute on function public.request_my_deletion() to authenticated;

-- A member cancels their own request while it is still pending.
create or replace function public.cancel_my_deletion()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'not signed in' using errcode = '42501'; end if;
  update public.deletion_requests set status = 'cancelled', cancelled_at = now()
   where user_id = auth.uid() and status = 'pending'
  returning id into v_id;
  if v_id is null then raise exception 'no pending request' using errcode = 'P0002'; end if;
  insert into public.admin_audit_log (actor_id, action, entity_type, entity_id, changed_fields)
  values (null, 'deletion.cancelled', 'deletion_request', v_id::text, '{}'::jsonb);
end;
$$;
revoke execute on function public.cancel_my_deletion() from public, anon;
grant execute on function public.cancel_my_deletion() to authenticated;

-- Is this account staff (any role now, or named as the actor of any audit entry)? Then it is anonymized and
-- blocked instead of deleted.
create or replace function app.is_staff_account(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.user_roles r where r.user_id = p_user)
      or exists (select 1 from public.admin_audit_log a where a.actor_id = p_user);
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- 3. The deletion run. Server only (service role): the admin route checks the admin first and passes their id; the
--    daily job passes null. Safe to run again on a request left in 'processing'.
-- ---------------------------------------------------------------------------------------------------------------
create or replace function public.erase_member_prepare(p_request uuid, p_admin uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_req public.deletion_requests;
  v_user uuid;
  v_email text;
  v_token text;
  v_staff boolean;
  v_uid text;
  v_email_re text;
begin
  select * into v_req from public.deletion_requests where id = p_request for update;
  if not found then raise exception 'unknown deletion request' using errcode = 'P0002'; end if;
  if v_req.status not in ('pending', 'processing') then raise exception 'deletion request is %', v_req.status using errcode = 'P0001'; end if;
  if v_req.user_id is null then raise exception 'account already deleted' using errcode = 'P0001'; end if;
  v_user := v_req.user_id;
  v_uid := v_user::text;
  select lower(u.email) into v_email from auth.users u where u.id = v_user;
  v_token := coalesce(v_req.subject_token, 'deleted-user-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  v_staff := app.is_staff_account(v_user);

  -- Recorded before anything changes.
  insert into public.admin_audit_log (actor_id, action, entity_type, entity_id, changed_fields)
  values (p_admin, 'deletion.started', 'deletion_request', p_request::text,
          jsonb_build_object('via', case when p_admin is null then 'schedule' else 'admin' end,
                             'outcome', case when v_staff then 'anonymized' else 'deleted' end, 'subject', v_token));

  perform set_config('app.erasure_request', p_request::text, true);

  -- Audit log: the member's id and email become the token. Who acted, what and when stay as they were.
  update public.admin_audit_log set entity_id = v_token where entity_id = v_uid;
  update public.admin_audit_log
     set changed_fields = replace(changed_fields::text, v_uid, v_token)::jsonb
   where position(v_uid in changed_fields::text) > 0;
  update public.admin_audit_log set reason = replace(reason, v_uid, v_token) where position(v_uid in coalesce(reason, '')) > 0;
  if v_email is not null and v_email <> '' then
    -- Case insensitive, and only the email itself changes (regex special characters in it are escaped).
    v_email_re := regexp_replace(v_email, '([.^$*+?()\[\]{}|\\-])', '\\\1', 'g');
    update public.admin_audit_log
       set changed_fields = regexp_replace(changed_fields::text, v_email_re, v_token, 'gi')::jsonb
     where position(v_email in lower(changed_fields::text)) > 0;
    update public.admin_audit_log set reason = regexp_replace(reason, v_email_re, v_token, 'gi')
     where position(v_email in lower(coalesce(reason, ''))) > 0;
  end if;

  -- Purchase records kept for tax and refunds (7 years, Slice C), anonymized.
  update public.orders set email = v_token, user_id = null
   where user_id = v_user or (v_email is not null and lower(email) = v_email);

  -- The member's own data.
  delete from public.worksheet_responses where user_id = v_user;
  delete from public.path_overrides where user_id = v_user;
  delete from public.roadmap_items where user_id = v_user;
  delete from public.audit_drafts where user_id = v_user;
  delete from public.audit_runs where user_id = v_user;
  delete from public.lesson_progress where user_id = v_user;
  delete from public.milestone_progress where user_id = v_user;
  delete from public.coaching_questions where user_id = v_user;
  delete from public.hotseat_applications where user_id = v_user;
  delete from public.feedback_submissions where user_id = v_user;
  delete from public.community_reports where reporter_id = v_user;
  delete from public.community_comments where user_id = v_user;
  delete from public.community_posts where user_id = v_user;
  delete from public.elite_applications where user_id = v_user or (v_email is not null and lower(email) = v_email);
  -- Elite workspace: time entries before the hour allowances they draw on, then the board and everything on it.
  delete from public.elite_time_entries where board_id in (select id from public.elite_boards where client_id = v_user);
  delete from public.elite_hour_buckets where board_id in (select id from public.elite_boards where client_id = v_user);
  delete from public.elite_boards where client_id = v_user;
  delete from public.coach_assignments where student_id = v_user or coach_id = v_user;
  delete from public.entitlements where user_id = v_user;
  delete from public.subscriptions where user_id = v_user;
  delete from public.stripe_customers where user_id = v_user;
  delete from public.data_exports where user_id = v_user;

  if v_staff then
    -- Staff: the account stays (the audit log names it) but nothing personal remains on it.
    delete from public.user_roles where user_id = v_user;
    update public.elite_boards set coach_id = null where coach_id = v_user;
    update public.profiles set display_name = v_token, timezone = 'America/New_York' where user_id = v_user;
  else
    delete from public.profiles where user_id = v_user;
  end if;

  update public.deletion_requests
     set status = 'processing', subject_token = v_token, outcome = case when v_staff then 'anonymized' else 'deleted' end,
         processing_started_at = coalesce(processing_started_at, now())
   where id = p_request;

  return jsonb_build_object('user_id', v_user, 'outcome', case when v_staff then 'anonymized' else 'deleted' end, 'token', v_token);
end;
$$;
revoke execute on function public.erase_member_prepare(uuid, uuid) from public, anon, authenticated;
grant execute on function public.erase_member_prepare(uuid, uuid) to service_role;

create or replace function public.erase_member_finish(p_request uuid, p_admin uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_req public.deletion_requests;
begin
  select * into v_req from public.deletion_requests where id = p_request for update;
  if not found or v_req.status <> 'processing' then raise exception 'deletion request is not processing' using errcode = 'P0001'; end if;
  update public.deletion_requests
     set status = 'completed', completed_at = now(),
         completed_by = case when p_admin is null then 'schedule' else 'admin' end, completed_by_admin = p_admin,
         -- The member's id is gone with the account; for staff the request no longer points at the kept account.
         user_id = null
   where id = p_request;
  insert into public.admin_audit_log (actor_id, action, entity_type, entity_id, changed_fields)
  values (p_admin, 'deletion.completed', 'deletion_request', p_request::text,
          jsonb_build_object('outcome', v_req.outcome, 'subject', v_req.subject_token));
end;
$$;
revoke execute on function public.erase_member_finish(uuid, uuid) from public, anon, authenticated;
grant execute on function public.erase_member_finish(uuid, uuid) to service_role;
