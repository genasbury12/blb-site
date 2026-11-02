-- The BOSS Business System
-- Migration 1100: admins may grant or remove the coach role (audited). The admin role itself is granted
-- only by the server managed script or SQL (D09: no self promotion, server managed admin allowlist).

create or replace function public.admin_set_coach_role(p_user uuid, p_enabled boolean, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not app.is_admin() then raise exception 'admin role required' using errcode = '42501'; end if;
  if char_length(trim(coalesce(p_reason, ''))) < 5 then raise exception 'a reason of at least 5 characters is required'; end if;
  if p_enabled then
    insert into public.user_roles (user_id, role, granted_by) values (p_user, 'coach', auth.uid()) on conflict do nothing;
  else
    delete from public.user_roles where user_id = p_user and role = 'coach';
    delete from public.coach_assignments where coach_id = p_user;
  end if;
  insert into public.admin_audit_log (actor_id, action, entity_type, entity_id, changed_fields, reason)
  values (auth.uid(), case when p_enabled then 'role.coach.grant' else 'role.coach.revoke' end, 'user', p_user::text, '{}'::jsonb, trim(p_reason));
end;
$$;
revoke execute on function public.admin_set_coach_role(uuid, boolean, text) from public, anon;
grant execute on function public.admin_set_coach_role(uuid, boolean, text) to authenticated;
