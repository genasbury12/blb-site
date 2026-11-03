-- Migration 1600: save and complete worksheet responses (09_IMPLEMENT_WORKSHEETS, Slice B).
--
-- Both functions run as the signed in member (security invoker), so every row is still checked by the RLS from
-- migration 1500: a member can only touch their own response, and only while the worksheet is published and
-- visible to them. The server action validates each answer against the worksheet schema before calling these.

-- Autosave: shallow merge of the changed answers into the saved ones (never replaces untouched answers).
-- A response follows the currently published version of its worksheet.
create or replace function public.save_worksheet_answers(p_slug text, p_patch jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_version int;
  v_row public.worksheet_responses%rowtype;
begin
  if p_patch is null or jsonb_typeof(p_patch) <> 'object' then
    raise exception 'Invalid answers' using errcode = '22023';
  end if;
  select w.version into v_version from public.worksheets w where w.slug = p_slug and w.status = 'published';
  if v_version is null then
    raise exception 'This worksheet is not available' using errcode = '42501';
  end if;
  insert into public.worksheet_responses (user_id, worksheet_slug, worksheet_version, answers)
  values (auth.uid(), p_slug, v_version, p_patch)
  on conflict (user_id, worksheet_slug) do update
    set answers = public.worksheet_responses.answers || excluded.answers,
        worksheet_version = excluded.worksheet_version
  returning * into v_row;
  return jsonb_build_object('id', v_row.id, 'status', v_row.status, 'updated_at', v_row.updated_at);
end;
$$;

-- Complete: marks the response complete (answers stay editable; completed_at is kept from the first completion)
-- and ticks the module milestone whose title equals the worksheet's completion.milestone_label, when one is
-- published (the existing milestone mechanism). No matching milestone is not an error.
create or replace function public.complete_worksheet(p_slug text)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_row public.worksheet_responses%rowtype;
  v_label text;
  v_module uuid;
  v_milestone uuid;
begin
  update public.worksheet_responses
     set status = 'complete', completed_at = coalesce(completed_at, now())
   where user_id = auth.uid() and worksheet_slug = p_slug
  returning * into v_row;
  if not found then
    raise exception 'Answer the worksheet before completing it' using errcode = 'P0002';
  end if;
  select w.schema #>> '{completion,milestone_label}', l.module_id into v_label, v_module
    from public.worksheets w join public.lessons l on l.id = w.lesson_id
   where w.slug = p_slug and w.version = v_row.worksheet_version;
  if v_label is not null then
    select m.id into v_milestone from public.milestones m
     where m.module_id = v_module and m.title = v_label and m.status = 'published'
     order by m.order_index limit 1;
    if v_milestone is not null then
      insert into public.milestone_progress (user_id, milestone_id, state, completed_at)
      values (auth.uid(), v_milestone, 'done', now())
      on conflict (user_id, milestone_id) do update
        set state = 'done', completed_at = coalesce(public.milestone_progress.completed_at, now());
    end if;
  end if;
  return jsonb_build_object('status', v_row.status, 'completed_at', v_row.completed_at, 'milestone', v_milestone is not null);
end;
$$;

revoke execute on function public.save_worksheet_answers(text, jsonb) from public, anon;
revoke execute on function public.complete_worksheet(text) from public, anon;
grant execute on function public.save_worksheet_answers(text, jsonb) to authenticated;
grant execute on function public.complete_worksheet(text) to authenticated;
