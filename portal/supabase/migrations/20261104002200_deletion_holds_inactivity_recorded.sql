-- The BOSS Business System
-- Migration 2200: owner decisions 2026-11-04 on data rights.
--   1. A member with a payment plan still running, or a membership payment past due, owes a balance: her deletion
--      request (her own, recorded for her, or from retention) waits for an admin and never runs automatically.
--   2. Accounts with no purchase are deleted 12 months after their last sign in, with the same reminders.
--   3. Admins can record a deletion request a member made by email.

alter table public.deletion_requests drop constraint deletion_requests_origin_check;
alter table public.deletion_requests add constraint deletion_requests_origin_check check (origin in ('member', 'retention', 'inactivity'));
-- The admin who recorded a request on the member's behalf (for example asked by email).
alter table public.deletion_requests add column recorded_by uuid references auth.users (id) on delete set null;

-- ---------------------------------------------------------------------------------------------------------------
-- 1. What a member still owes. Installment plans: remaining payments times the payment amount. Memberships past due:
--    one period. Readable by admins, the server, and a member about herself.
-- ---------------------------------------------------------------------------------------------------------------
create or replace function public.deletion_balances(p_users uuid[])
returns table (user_id uuid, kind text, sku text, remaining_payments integer, amount_cents bigint)
language sql
stable
security definer
set search_path = ''
as $$
  with allowed as (
    select u from unnest(p_users) u
    where auth.uid() is null or app.is_admin() or u = auth.uid()
  )
  select o.user_id, 'installments', o.sku::text, o.installments_total - o.installments_paid,
         ((o.installments_total - o.installments_paid) * o.amount_cents)::bigint
  from public.orders o
  where o.user_id in (select u from allowed)
    and o.status in ('installments_current', 'installments_past_due')
    and o.installments_total > o.installments_paid
  union all
  select s.user_id, 'membership_past_due', s.sku::text, 1,
         coalesce((select p.amount_cents from public.prices p where p.sku = s.sku and p.plan = 'monthly'), 0)::bigint
  from public.subscriptions s
  where s.user_id in (select u from allowed)
    and s.status in ('past_due', 'unpaid');
$$;
revoke execute on function public.deletion_balances(uuid[]) from public, anon;
grant execute on function public.deletion_balances(uuid[]) to authenticated, service_role;

-- ---------------------------------------------------------------------------------------------------------------
-- 2. Retention facts now cover two groups: members whose access ended ('access_ended', since = when it ended) and
--    accounts that never bought anything ('inactive', since = last sign in, or sign up if never). Also marks who owes
--    a balance (held). retention_notices.access_ended_at holds the 'since' value for either group.
-- ---------------------------------------------------------------------------------------------------------------
drop function public.retention_facts(timestamptz);
create function public.retention_facts(p_at timestamptz default now())
returns table (user_id uuid, basis text, since timestamptz, is_staff boolean, has_open_request boolean, held boolean, notices text[])
language sql
stable
security definer
set search_path = ''
as $$
  with lapsed as (
    select u.id, 'access_ended'::text as basis, app.access_ended_at(u.id, p_at) as since
    from auth.users u
    where exists (select 1 from public.entitlements e where e.user_id = u.id)
  ),
  inactive as (
    select u.id, 'inactive'::text as basis, coalesce(u.last_sign_in_at, u.created_at) as since
    from auth.users u
    where not exists (select 1 from public.entitlements e where e.user_id = u.id)
      and not exists (select 1 from public.orders o where o.user_id = u.id)
  ),
  people as (
    select * from lapsed where since is not null
    union all
    select * from inactive
  )
  select p.id, p.basis, p.since, app.is_staff_account(p.id),
         exists (select 1 from public.deletion_requests r where r.user_id = p.id and r.status in ('pending', 'processing')),
         exists (select 1 from public.deletion_balances(array[p.id])),
         coalesce((select array_agg(n.kind order by n.kind) from public.retention_notices n where n.user_id = p.id and n.access_ended_at = p.since), '{}')
  from people p;
$$;
revoke execute on function public.retention_facts(timestamptz) from public, anon, authenticated;
grant execute on function public.retention_facts(timestamptz) to service_role;

-- ---------------------------------------------------------------------------------------------------------------
-- 3. An admin records a deletion request for a member (for example one who asked by email and cannot sign in).
-- ---------------------------------------------------------------------------------------------------------------
create or replace function public.admin_record_deletion(p_user uuid)
returns public.deletion_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.deletion_requests;
begin
  if not app.is_admin() then raise exception 'admin role required' using errcode = '42501'; end if;
  if p_user = auth.uid() then raise exception 'use My Account to delete your own account' using errcode = '42501'; end if;
  if not exists (select 1 from auth.users u where u.id = p_user) then raise exception 'unknown account' using errcode = 'P0002'; end if;
  perform pg_advisory_xact_lock(hashtext('deletion:' || p_user::text));
  select * into v_row from public.deletion_requests where user_id = p_user and status in ('pending', 'processing');
  if found then return v_row; end if;
  insert into public.deletion_requests (user_id, recorded_by) values (p_user, auth.uid()) returning * into v_row;
  insert into public.admin_audit_log (actor_id, action, entity_type, entity_id, changed_fields)
  values (auth.uid(), 'deletion.recorded', 'deletion_request', v_row.id::text, jsonb_build_object('due_at', v_row.due_at));
  return v_row;
end;
$$;
revoke execute on function public.admin_record_deletion(uuid) from public, anon;
grant execute on function public.admin_record_deletion(uuid) to authenticated;
