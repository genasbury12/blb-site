-- The BOSS Business System
-- Migration 1800: 10_DATA_RIGHTS Slice A. "Download all my data": rate limit and audit trail.
-- The ZIP itself is built on request and never stored. This records only who exported whose data, when, how
-- many bytes, and how; never the content.

create table public.data_exports (
  id uuid primary key default gen_random_uuid(),
  -- Whose data. Deleted with the member (their data is gone, so is this bookkeeping).
  user_id uuid not null references auth.users (id) on delete cascade,
  requested_by uuid references auth.users (id) on delete set null,
  via text not null check (via in ('member', 'admin')),
  status text not null default 'started' check (status in ('started', 'completed', 'failed')),
  bytes bigint check (bytes is null or bytes >= 0),
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index data_exports_user_idx on public.data_exports (user_id, created_at desc);
alter table public.data_exports enable row level security;
create policy "members read own exports" on public.data_exports for select to authenticated using (user_id = auth.uid());
create policy "admins read exports" on public.data_exports for select to authenticated using (app.is_admin());
-- No insert, update or delete policies: only the functions below write.

-- Start an export. A member may export only their own data; an admin may export anyone's. One export per member
-- per 10 minutes for each path (member or admin), counting started and completed ones, so a failed one can be retried.
create or replace function public.start_data_export(p_user uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := auth.uid();
  v_via text;
  v_last timestamptz;
  v_id uuid;
begin
  if v_caller is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if p_user = v_caller then
    v_via := 'member';
  elsif app.is_admin() then
    v_via := 'admin';
  else
    raise exception 'not permitted' using errcode = '42501';
  end if;
  if not exists (select 1 from auth.users u where u.id = p_user) then raise exception 'unknown account' using errcode = 'P0002'; end if;
  perform pg_advisory_xact_lock(hashtext('data_export:' || p_user::text));
  select max(e.created_at) into v_last from public.data_exports e
   where e.user_id = p_user and e.via = v_via and e.status in ('started', 'completed') and e.created_at > now() - interval '10 minutes';
  if v_last is not null then
    raise exception 'rate_limited' using errcode = 'P0001',
      hint = ceil(extract(epoch from (v_last + interval '10 minutes' - now())))::text;
  end if;
  insert into public.data_exports (user_id, requested_by, via) values (p_user, v_caller, v_via) returning id into v_id;
  return v_id;
end;
$$;
revoke execute on function public.start_data_export(uuid) from public, anon;
grant execute on function public.start_data_export(uuid) to authenticated;

-- Finish an export: completed with its size (audited), or failed (frees the rate limit, not audited).
-- Audit entry: an admin export names the admin as actor. A member's own export has no actor, so the member's account
-- stays deletable (the audit log is append only and blocks deleting anyone it names as actor); the member is the
-- entity, recorded as text, which the deletion process (Slice B) anonymizes.
create or replace function public.finish_data_export(p_id uuid, p_bytes bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.data_exports;
begin
  select * into v_row from public.data_exports e where e.id = p_id and e.requested_by = auth.uid() and e.status = 'started' for update;
  if not found then raise exception 'unknown export' using errcode = 'P0002'; end if;
  if p_bytes is null then
    update public.data_exports set status = 'failed', finished_at = now() where id = p_id;
    return;
  end if;
  update public.data_exports set status = 'completed', bytes = p_bytes, finished_at = now() where id = p_id;
  insert into public.admin_audit_log (actor_id, action, entity_type, entity_id, changed_fields)
  values (case when v_row.via = 'admin' then v_row.requested_by end, 'data.export', 'user', v_row.user_id::text,
          jsonb_build_object('bytes', p_bytes, 'via', v_row.via));
end;
$$;
revoke execute on function public.finish_data_export(uuid, bigint) from public, anon;
grant execute on function public.finish_data_export(uuid, bigint) to authenticated;
