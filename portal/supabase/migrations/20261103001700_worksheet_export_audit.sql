-- The BOSS Business System
-- Migration 1700: 09_IMPLEMENT_WORKSHEETS Slice D. Admin CSV exports of worksheet answers are audited.
-- Records who exported which worksheet and how many rows; never answer content.

create or replace function public.admin_log_worksheet_export(p_slug text, p_rows integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not app.is_admin() then raise exception 'admin role required' using errcode = '42501'; end if;
  if not exists (select 1 from public.worksheets w where w.slug = p_slug) then raise exception 'unknown worksheet' using errcode = 'P0002'; end if;
  insert into public.admin_audit_log (actor_id, action, entity_type, entity_id, changed_fields)
  values (auth.uid(), 'worksheet.export_csv', 'worksheet', p_slug, jsonb_build_object('rows', greatest(coalesce(p_rows, 0), 0)));
end;
$$;
revoke execute on function public.admin_log_worksheet_export(text, integer) from public, anon;
grant execute on function public.admin_log_worksheet_export(text, integer) to authenticated;
