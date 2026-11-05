-- The BOSS Business System
-- Migration 2000: 10_DATA_RIGHTS Slice B follow up (owner decision 2026-11-04). When a member is deleted, community
-- threads stay: their posts and replies remain in place with the words replaced by a removal note and no author
-- (shown as "Deleted member"), so other members' replies are kept.

-- Posts and replies may outlive their author's account.
alter table public.community_posts alter column user_id drop not null;
alter table public.community_posts drop constraint community_posts_user_id_fkey;
alter table public.community_posts add constraint community_posts_user_id_fkey foreign key (user_id) references auth.users (id) on delete set null;
alter table public.community_comments alter column user_id drop not null;
alter table public.community_comments drop constraint community_comments_user_id_fkey;
alter table public.community_comments add constraint community_comments_user_id_fkey foreign key (user_id) references auth.users (id) on delete set null;

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
  -- Community threads stay for the other members (owner decision 2026-11-04): the member's own posts and replies keep
  -- their place but lose their words and their author.
  update public.community_posts
     set user_id = null, title = 'Removed post', body = 'This post was removed because the member deleted their account.'
   where user_id = v_user;
  update public.community_comments
     set user_id = null, body = 'This reply was removed because the member deleted their account.'
   where user_id = v_user;
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
