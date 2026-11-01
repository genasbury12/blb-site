-- The BOSS Business System
-- Migration 0500: atomic audit submission. One transaction writes the immutable run, its roadmap
-- items, the onboarding state, and consumes the draft. Server only (service role).

create or replace function public.record_audit_submission(p_run jsonb, p_roadmap jsonb, p_draft_id uuid)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_run_id uuid;
  v_user uuid := (p_run ->> 'user_id')::uuid;
begin
  if jsonb_typeof(p_roadmap) <> 'array' then
    raise exception 'roadmap must be an array';
  end if;

  insert into public.audit_runs (user_id, version_id, scoring_version, answers_snapshot_json, category_scores_json,
                                 overall_score, assigned_path, recommendation_snapshot_json)
  values (
    v_user,
    (p_run ->> 'version_id')::uuid,
    p_run ->> 'scoring_version',
    p_run -> 'answers_snapshot_json',
    p_run -> 'category_scores_json',
    (p_run ->> 'overall_score')::numeric,
    (p_run ->> 'assigned_path')::public.learning_path,
    p_run -> 'recommendation_snapshot_json'
  )
  returning id into v_run_id;

  insert into public.roadmap_items (user_id, source_audit_run_id, month_number, priority_order, title, reason,
                                    recommended_module_number, recommended_lesson_id)
  select v_user, v_run_id, (r ->> 'month_number')::int, (r ->> 'priority_order')::int, r ->> 'title', r ->> 'reason',
         (r ->> 'recommended_module_number')::int, (r ->> 'recommended_lesson_id')::uuid
  from jsonb_array_elements(p_roadmap) r;

  update public.profiles set onboarding_state = 'audit_completed' where user_id = v_user;
  delete from public.audit_drafts where id = p_draft_id and user_id = v_user;
  return v_run_id;
end;
$$;

revoke execute on function public.record_audit_submission(jsonb, jsonb, uuid) from public, anon, authenticated;
grant execute on function public.record_audit_submission(jsonb, jsonb, uuid) to service_role;
