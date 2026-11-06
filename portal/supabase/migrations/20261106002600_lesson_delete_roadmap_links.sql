-- The BOSS Business System
-- Migration 2600: deleting a lesson clears members' roadmap links to it (owner run 2026-11-06).
--
-- roadmap_items.recommended_lesson_id is "on delete set null", but the roadmap guard (migration 400) lets a signed
-- in user change only an item's state, and the delete runs in a signed in admin's session, so the cascade was refused
-- and "Delete all sample lessons" failed with nothing changed. The guard now also allows that one change: the link to
-- the lesson being deleted (app.lesson_delete, set by app.delete_lesson_core) becoming empty, with nothing else
-- touched. Members still change only their items' state. Safe to run where it already exists.

create or replace function app.guard_roadmap_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_setting('role', true) = 'authenticated' and (
       new.user_id <> old.user_id or new.title <> old.title or new.month_number <> old.month_number
       or new.priority_order <> old.priority_order or new.source_audit_run_id is distinct from old.source_audit_run_id
       or (new.recommended_lesson_id is distinct from old.recommended_lesson_id
           and not (new.recommended_lesson_id is null
                    and old.recommended_lesson_id::text = coalesce(current_setting('app.lesson_delete', true), '')))
       or new.recommended_module_number is distinct from old.recommended_module_number
       or new.reason is distinct from old.reason) then
    raise exception 'Only the state of a roadmap item can be changed' using errcode = '42501';
  end if;
  return new;
end;
$$;
