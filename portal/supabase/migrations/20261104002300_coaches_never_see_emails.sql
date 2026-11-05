-- The BOSS Business System
-- Migration 2300: 10_DATA_RIGHTS Slice D. Coaches never see a member's email address anywhere.
-- Elite applications were the one place a coach could read an email (the table policy allowed all staff). Admins keep
-- reading the table; coaches get the same applications through coach_elite_applications(), which leaves the email out.

drop policy "staff read applications" on public.elite_applications;
create policy "admins read applications" on public.elite_applications for select to authenticated using (app.is_admin());

create or replace function public.coach_elite_applications()
returns table (
  id uuid, user_id uuid, name text, business_url text, business_stage text, goals text, biggest_challenge text,
  hours_per_week integer, status text, discovery_at timestamptz, decision_note text, accepted_until timestamptz,
  decided_at timestamptz, created_at timestamptz, updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.user_id, a.name, a.business_url, a.business_stage::text, a.goals, a.biggest_challenge,
         a.hours_per_week, a.status::text, a.discovery_at, a.decision_note, a.accepted_until, a.decided_at, a.created_at, a.updated_at
  from public.elite_applications a
  where app.is_staff();
$$;
revoke execute on function public.coach_elite_applications() from public, anon;
grant execute on function public.coach_elite_applications() to authenticated;
