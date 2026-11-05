-- The BOSS Business System
-- Migration 2100: 10_DATA_RIGHTS Slice C. Retention.
--   * Members: kept while they have access. When access ends, their data and their download stay for 12 months;
--     then the account is deleted by the Slice B process (a deletion request with origin 'retention'). Reminder
--     emails 30 and 7 days before.
--   * Audit log: kept indefinitely, anonymized by deletions.
--   * Purchase records of deleted members (already anonymized): kept 7 years, then removed.
--   * Staff accounts are never part of retention.
-- The rules and numbers live in src/domain/data-rights/retention.ts; the daily job applies them.

-- Where a deletion request came from.
alter table public.deletion_requests add column origin text not null default 'member' check (origin in ('member', 'retention'));

-- When did this member's access end? Null while they still have any access, or if they never had any.
-- Per access grant: the earlier of its end date and the moment it stopped counting (revoked or suspended, order
-- refunded or canceled, payment more than the grace period overdue, subscription ended). The latest of those across
-- grants is the end. Where a moment is unclear the later timestamp is used, so data is kept longer, never shorter.
create or replace function app.access_ended_at(p_user uuid, p_at timestamptz default now())
returns timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  with ends as (
    select least(
      coalesce(e.ends_at, 'infinity'::timestamptz),
      case
        when e.state <> 'active' then e.updated_at
        when e.source_type = 'order' and (o.id is null or o.status not in ('paid', 'installments_current', 'installments_past_due', 'installments_completed'))
          then greatest(e.updated_at, coalesce(o.updated_at, e.updated_at))
        when e.source_type = 'order' and o.past_due_since is not null and o.past_due_since + app.grace_period() <= p_at
          then o.past_due_since + app.grace_period()
        when e.source_type = 'subscription' and (s.id is null or s.status not in ('active', 'past_due', 'canceled'))
          then greatest(e.updated_at, coalesce(s.updated_at, e.updated_at))
        when e.source_type = 'subscription' and s.past_due_since is not null and s.past_due_since + app.grace_period() <= p_at
          then s.past_due_since + app.grace_period()
        else 'infinity'::timestamptz
      end
    ) as ended
    from public.entitlements e
    left join public.orders o on e.source_type = 'order' and o.id = e.source_id
    left join public.subscriptions s on e.source_type = 'subscription' and s.id = e.source_id
    where e.user_id = p_user
  )
  select case
    when not exists (select 1 from ends) then null
    when exists (select 1 from unnest(enum_range(null::public.feature_key)) f(k) where app.has_feature(f.k, p_user, p_at)) then null
    when (select max(ended) from ends) >= p_at then null
    else (select max(ended) from ends)
  end;
$$;

-- Reminders already sent, per lapse (a member who comes back and lapses again gets new reminders).
create table public.retention_notices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('30_days', '7_days')),
  access_ended_at timestamptz not null,
  sent_at timestamptz not null default now(),
  unique (user_id, kind, access_ended_at)
);
alter table public.retention_notices enable row level security;
create policy "admins read retention notices" on public.retention_notices for select to authenticated using (app.is_admin());

-- Facts the daily job needs about every member whose access has ended. Server only.
create or replace function public.retention_facts(p_at timestamptz default now())
returns table (user_id uuid, access_ended_at timestamptz, is_staff boolean, has_open_request boolean, notices text[])
language sql
stable
security definer
set search_path = ''
as $$
  with lapsed as (
    select u.id, app.access_ended_at(u.id, p_at) as ended
    from auth.users u
    where exists (select 1 from public.entitlements e where e.user_id = u.id)
  )
  select l.id, l.ended, app.is_staff_account(l.id),
         exists (select 1 from public.deletion_requests r where r.user_id = l.id and r.status in ('pending', 'processing')),
         coalesce((select array_agg(n.kind order by n.kind) from public.retention_notices n where n.user_id = l.id and n.access_ended_at = l.ended), '{}')
  from lapsed l
  where l.ended is not null;
$$;
revoke execute on function public.retention_facts(timestamptz) from public, anon, authenticated;
grant execute on function public.retention_facts(timestamptz) to service_role;

-- Runs of the daily data rights job, for Admin, Settings, Data. Counts only, never member data.
create table public.job_runs (
  id uuid primary key default gen_random_uuid(),
  job text not null check (char_length(job) between 3 and 60),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'ok', 'failed')),
  summary jsonb not null default '{}'::jsonb
);
create index job_runs_job_idx on public.job_runs (job, started_at desc);
alter table public.job_runs enable row level security;
create policy "admins read job runs" on public.job_runs for select to authenticated using (app.is_admin());

-- Remove anonymized purchase records of deleted members once they are older than the retention period.
create or replace function public.purge_expired_purchase_records(p_years integer, p_at timestamptz default now())
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if p_years < 1 then raise exception 'retention must be at least one year'; end if;
  with gone as (
    delete from public.orders o
     where o.user_id is null and o.email ~ '^deleted-user-[0-9a-f]{10}$'
       and greatest(o.created_at, o.updated_at) < p_at - make_interval(years => p_years)
    returning o.id
  )
  select count(*) into v_count from gone;
  return v_count;
end;
$$;
revoke execute on function public.purge_expired_purchase_records(integer, timestamptz) from public, anon, authenticated;
grant execute on function public.purge_expired_purchase_records(integer, timestamptz) to service_role;
