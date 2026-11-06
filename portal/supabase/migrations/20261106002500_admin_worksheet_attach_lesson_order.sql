-- The BOSS Business System
-- Migration 2500: admins manage lesson worksheets and lesson order themselves (owner request 2026-11-06).
--
-- 1. A worksheet can be detached from every lesson (lesson_id null). Members still see a worksheet only when it is
--    published AND its lesson is visible to them (the read policy calls app.lesson_visible_to_student, which is false
--    for a null lesson), so a detached worksheet is never served.
-- 2. One worksheet per lesson. Before this, a lesson could carry several worksheets as long as only one was
--    published (migration 2400). Now a lesson holds at most one worksheet in any status; every version of a
--    worksheet shares its lesson.
-- 3. public.attach_worksheet moves a worksheet (all versions) onto a lesson, detaching whatever worksheet that lesson
--    had, or detaches it (lesson null). Runs as the signed in admin, so the audit trigger records each change.
-- 4. Lesson positions can be swapped: the (module_id, order_index) unique constraint becomes deferrable (still checked
--    at the end of every statement unless a transaction defers it), and public.move_lesson swaps a lesson with its
--    neighbour inside one transaction. Same constraint name, so the admin's "Position N is taken by" message holds.
-- 5. Deleting lessons: see below. 6. Positions up to 999. 7. Publish rules no longer block position edits.
-- Safe to run where it already exists.

alter table public.worksheets alter column lesson_id drop not null;

create or replace function app.guard_one_worksheet_per_lesson()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.lesson_id is not null and exists (
    select 1 from public.worksheets w where w.lesson_id = new.lesson_id and w.slug <> new.slug
  ) then
    raise exception 'This lesson already has a worksheet. Detach it first.' using errcode = 'P0001', hint = 'one_worksheet_per_lesson';
  end if;
  return new;
end;
$$;

drop trigger if exists worksheets_one_per_lesson on public.worksheets;
create trigger worksheets_one_per_lesson before insert or update of lesson_id on public.worksheets
  for each row execute function app.guard_one_worksheet_per_lesson();

-- Moves worksheet p_slug onto lesson p_lesson_id (null detaches it). Returns the lesson it came from and the worksheet
-- it replaced, if any.
create or replace function public.attach_worksheet(p_slug text, p_lesson_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_from uuid;
  v_replaced text;
begin
  if not app.is_admin() then
    raise exception 'Not permitted' using errcode = '42501';
  end if;
  select w.lesson_id into v_from from public.worksheets w where w.slug = p_slug order by w.version desc limit 1;
  if not found then
    raise exception 'Worksheet not found' using errcode = 'P0002';
  end if;
  if p_lesson_id is not null then
    -- Lock the lesson so two moves onto it cannot both pass the one-per-lesson check.
    perform 1 from public.lessons l where l.id = p_lesson_id for update;
    if not found then
      raise exception 'Lesson not found' using errcode = 'P0002';
    end if;
    select w.slug into v_replaced from public.worksheets w where w.lesson_id = p_lesson_id and w.slug <> p_slug limit 1;
    update public.worksheets set lesson_id = null where lesson_id = p_lesson_id and slug <> p_slug;
  end if;
  update public.worksheets set lesson_id = p_lesson_id where slug = p_slug and lesson_id is distinct from p_lesson_id;
  return jsonb_build_object('from', v_from, 'replaced', v_replaced);
end;
$$;

revoke execute on function public.attach_worksheet(text, uuid) from public, anon;
grant execute on function public.attach_worksheet(text, uuid) to authenticated;

-- Deferrable position constraint (same name, same columns). Dropped and re-added in one statement.
do $$
begin
  if exists (
    select 1 from pg_constraint
     where conname = 'lessons_module_id_order_index_key' and conrelid = 'public.lessons'::regclass and not condeferrable
  ) then
    alter table public.lessons
      drop constraint lessons_module_id_order_index_key,
      add constraint lessons_module_id_order_index_key unique (module_id, order_index) deferrable initially immediate;
  end if;
end;
$$;

-- Swaps a lesson with the one above ('up') or below ('down') it in its module. No-op at either end.
create or replace function public.move_lesson(p_lesson_id uuid, p_direction text)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_lesson record;
  v_other record;
begin
  if not app.is_admin() then
    raise exception 'Not permitted' using errcode = '42501';
  end if;
  if p_direction not in ('up', 'down') then
    raise exception 'Direction must be up or down' using errcode = '22023';
  end if;
  select l.id, l.module_id, l.order_index into v_lesson from public.lessons l where l.id = p_lesson_id for update;
  if not found then
    raise exception 'Lesson not found' using errcode = 'P0002';
  end if;
  if p_direction = 'up' then
    select l.id, l.order_index into v_other from public.lessons l
     where l.module_id = v_lesson.module_id and l.order_index < v_lesson.order_index
     order by l.order_index desc limit 1 for update;
  else
    select l.id, l.order_index into v_other from public.lessons l
     where l.module_id = v_lesson.module_id and l.order_index > v_lesson.order_index
     order by l.order_index asc limit 1 for update;
  end if;
  if not found then
    return jsonb_build_object('moved', false);
  end if;
  -- Both rows hold each other's position for a moment; the constraint is checked when the transaction ends.
  set constraints public.lessons_module_id_order_index_key deferred;
  update public.lessons set order_index = v_other.order_index where id = v_lesson.id;
  update public.lessons set order_index = v_lesson.order_index where id = v_other.id;
  return jsonb_build_object('moved', true, 'swapped_with', v_other.id, 'position', v_other.order_index);
end;
$$;

revoke execute on function public.move_lesson(uuid, text) from public, anon;
grant execute on function public.move_lesson(uuid, text) to authenticated;

-- 5. Deleting a lesson (owner request 2026-11-06; archiving stays separate). Removes the lesson row and its position,
--    its progress records, downloads (rows; the app removes the stored files) and content suggestions by cascade;
--    roadmap links to it become empty. An attached worksheet is DETACHED, never deleted: the worksheet and every
--    member's answers stay, ready for another lesson. A real lesson with member progress or worksheet answers needs
--    its exact title typed to confirm. One audit entry lists who, the lesson and everything removed.

-- What a delete would remove, for the confirm dialog.
create or replace function public.lesson_delete_preview(p_lesson_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_lesson record;
begin
  if not app.is_admin() then
    raise exception 'Not permitted' using errcode = '42501';
  end if;
  select l.id, l.title, l.is_sample into v_lesson from public.lessons l where l.id = p_lesson_id;
  if not found then
    raise exception 'Lesson not found' using errcode = 'P0002';
  end if;
  return jsonb_build_object(
    'title', v_lesson.title,
    'is_sample', v_lesson.is_sample,
    'progress', (select count(*) from public.lesson_progress p where p.lesson_id = p_lesson_id),
    'answers', (select count(*) from public.worksheet_responses r where r.worksheet_slug in (select w.slug from public.worksheets w where w.lesson_id = p_lesson_id)),
    'resources', (select count(*) from public.lesson_resources x where x.lesson_id = p_lesson_id),
    'suggestions', (select count(*) from public.content_suggestions c where c.lesson_id = p_lesson_id),
    'worksheets', coalesce((select jsonb_agg(jsonb_build_object('slug', w.slug, 'title', w.title)) from (select distinct on (x.slug) x.slug, x.title from public.worksheets x where x.lesson_id = p_lesson_id order by x.slug, x.version desc) w), '[]'::jsonb)
  );
end;
$$;

-- The delete itself. Internal (not callable by members or the Data API); the public wrappers check the admin.
create or replace function app.delete_lesson_core(p_lesson_id uuid, p_confirm_title text, p_reason text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lesson record;
  v_preview jsonb;
  v_keys jsonb;
begin
  select l.id, l.title, l.slug, l.module_id, l.order_index, l.is_sample, l.status into v_lesson from public.lessons l where l.id = p_lesson_id for update;
  if not found then
    raise exception 'Lesson not found' using errcode = 'P0002';
  end if;
  select jsonb_build_object(
    'progress', (select count(*) from public.lesson_progress p where p.lesson_id = p_lesson_id),
    'answers', (select count(*) from public.worksheet_responses r where r.worksheet_slug in (select w.slug from public.worksheets w where w.lesson_id = p_lesson_id)),
    'resources', (select count(*) from public.lesson_resources x where x.lesson_id = p_lesson_id),
    'suggestions', (select count(*) from public.content_suggestions c where c.lesson_id = p_lesson_id),
    'roadmap_links', (select count(*) from public.roadmap_items i where i.recommended_lesson_id = p_lesson_id)
  ) into v_preview;
  if not v_lesson.is_sample and ((v_preview ->> 'progress')::int > 0 or (v_preview ->> 'answers')::int > 0)
     and p_confirm_title is distinct from v_lesson.title then
    raise exception 'Type the lesson title exactly to confirm' using errcode = '22023';
  end if;
  v_keys := coalesce((select jsonb_agg(x.storage_key) from public.lesson_resources x where x.lesson_id = p_lesson_id), '[]'::jsonb);
  v_preview := v_preview || jsonb_build_object(
    'worksheets_detached', coalesce((select jsonb_agg(jsonb_build_object('slug', w.slug, 'title', w.title)) from (select distinct on (x.slug) x.slug, x.title from public.worksheets x where x.lesson_id = p_lesson_id order by x.slug, x.version desc) w), '[]'::jsonb)
  );
  update public.worksheets set lesson_id = null where lesson_id = p_lesson_id;
  perform set_config('app.lesson_delete', p_lesson_id::text, true);
  insert into public.admin_audit_log (actor_id, action, entity_type, entity_id, changed_fields, reason)
  values (auth.uid(), 'lessons.delete_permanently', 'lessons', p_lesson_id::text,
          jsonb_build_object('title', v_lesson.title, 'slug', v_lesson.slug, 'module_id', v_lesson.module_id, 'order_index', v_lesson.order_index,
                             'status', v_lesson.status, 'is_sample', v_lesson.is_sample, 'removed', v_preview),
          p_reason);
  delete from public.lessons where id = p_lesson_id;
  return jsonb_build_object('title', v_lesson.title, 'removed', v_preview, 'storage_keys', v_keys);
end;
$$;

revoke execute on function app.delete_lesson_core(uuid, text, text) from public, anon, authenticated;

create or replace function public.delete_lesson(p_lesson_id uuid, p_confirm_title text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not app.is_admin() then
    raise exception 'Not permitted' using errcode = '42501';
  end if;
  return app.delete_lesson_core(p_lesson_id, p_confirm_title);
end;
$$;

-- Every sample lesson, in every module, with their worksheets detached first. Returns what was detached.
create or replace function public.delete_sample_lessons()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_out jsonb := '[]'::jsonb;
  v_res jsonb;
begin
  if not app.is_admin() then
    raise exception 'Not permitted' using errcode = '42501';
  end if;
  for v_id in select l.id from public.lessons l where l.is_sample order by l.module_id, l.order_index loop
    v_res := app.delete_lesson_core(v_id, null);
    v_out := v_out || jsonb_build_array(v_res);
  end loop;
  return v_out;
end;
$$;

revoke execute on function public.lesson_delete_preview(uuid) from public, anon;
revoke execute on function public.delete_lesson(uuid, text) from public, anon;
revoke execute on function public.delete_sample_lessons() from public, anon;
grant execute on function public.lesson_delete_preview(uuid) to authenticated;
grant execute on function public.delete_lesson(uuid, text) to authenticated;
grant execute on function public.delete_sample_lessons() to authenticated;

-- A signed in user deletes lessons only through delete_lesson (which detaches worksheets, checks the confirmation
-- and writes the audit entry), never with a bare DELETE.
create or replace function app.guard_lesson_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_setting('role', true) = 'authenticated' and coalesce(current_setting('app.lesson_delete', true), '') <> old.id::text then
    raise exception 'Delete lessons with the Delete button, which detaches the worksheet and records what was removed.' using errcode = '42501';
  end if;
  return old;
end;
$$;

drop trigger if exists lessons_delete_guard on public.lessons;
create trigger lessons_delete_guard before delete on public.lessons for each row execute function app.guard_lesson_delete();

-- 6. Positions run 1 to 999 (was 99), so a lesson can be parked far down a module.
alter table public.lessons drop constraint if exists lessons_order_index_check;
alter table public.lessons add constraint lessons_order_index_check check (order_index between 1 and 999);

-- 7. Publish rules apply when a lesson is published, or when a published lesson's video fields change. Editing a
--    published lesson's position, title or text is never blocked by them (owner report 2026-11-06).
create or replace function app.guard_lesson_publish()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_check boolean;
begin
  if new.status = 'published' then
    v_check := tg_op = 'INSERT' or old.status is distinct from 'published'
      or new.video_provider_id is distinct from old.video_provider_id
      or new.captions_ready is distinct from old.captions_ready
      or new.transcript is distinct from old.transcript
      or new.is_sample is distinct from old.is_sample;
    if v_check then
      if new.is_sample and not app.config_bool('allow_sample_content') then
        raise exception 'Sample lessons cannot be published in this environment' using errcode = '23514';
      end if;
      if new.video_provider_id is not null and not new.captions_ready then
        raise exception 'Captions are required before a lesson with video is published' using errcode = '23514';
      end if;
      if new.video_provider_id is not null and coalesce(char_length(trim(new.transcript)), 0) = 0 then
        raise exception 'A transcript is required before a lesson with video is published' using errcode = '23514';
      end if;
    end if;
    if tg_op = 'INSERT' or old.status is distinct from 'published' then
      new.published_at := coalesce(new.published_at, now());
    end if;
  end if;
  return new;
end;
$$;
