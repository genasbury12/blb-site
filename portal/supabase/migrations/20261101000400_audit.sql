-- The BOSS Business System
-- Migration 0400: versioned business audit, drafts, immutable scored runs, path overrides, roadmap items.
-- Sources: Phase 2 "02 BOSS Business Audit and Scoring" (canonical text), handoff 04, D13.
-- Scores are computed by the deterministic engine in portal/src/domain/audit (no AI) and written
-- by server code only. Runs are immutable. Retakes create new runs and never touch progress.

create type public.audit_category as enum (
  'foundation', 'brand', 'content', 'marketing', 'product', 'email_sales', 'ai', 'productivity'
);
create type public.audit_version_status as enum ('draft', 'published', 'retired');

create table public.audit_versions (
  id uuid primary key default gen_random_uuid(),
  version_number int not null unique check (version_number > 0),
  status public.audit_version_status not null default 'draft',
  source_note text not null,
  scoring_config_json jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  check ((status = 'draft') or published_at is not null)
);
-- At most one published version at a time.
create unique index audit_versions_one_published on public.audit_versions ((status)) where status = 'published';
alter table public.audit_versions enable row level security;

create table public.audit_questions (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.audit_versions (id) on delete restrict,
  question_code text not null check (question_code ~ '^Q[0-9]{1,2}$'),
  number int not null check (number between 1 and 99),
  category_code public.audit_category not null,
  prompt text not null,
  options_json jsonb not null check (jsonb_typeof(options_json) = 'array' and jsonb_array_length(options_json) = 4),
  eligibility_rule jsonb, -- null in v1: no N/A answers (D13)
  unique (version_id, question_code),
  unique (version_id, number)
);
alter table public.audit_questions enable row level security;

-- Published versions are immutable once students can answer them.
create or replace function app.guard_audit_question_change()
returns trigger
language plpgsql
set search_path = ''
as $$
declare v_status public.audit_version_status;
begin
  select status into v_status from public.audit_versions
   where id = coalesce(new.version_id, old.version_id);
  if v_status <> 'draft' then
    raise exception 'Questions of a published or retired audit version cannot change; create a new version' using errcode = '42501';
  end if;
  return coalesce(new, old);
end;
$$;
create trigger audit_questions_guard before insert or update or delete on public.audit_questions
  for each row execute function app.guard_audit_question_change();

create policy "students read published audit versions" on public.audit_versions
  for select to authenticated
  using (status = 'published' and app.has_feature('audit.use'::public.feature_key, auth.uid(), now()));
create policy "students read questions of readable versions" on public.audit_questions
  for select to authenticated
  using (exists (
    select 1 from public.audit_versions v
    where v.id = version_id and v.status in ('published', 'retired')
  ) and app.has_feature('audit.use'::public.feature_key, auth.uid(), now()));
create policy "staff read audit versions" on public.audit_versions
  for select to authenticated using (app.is_admin() or app.has_role('coach'::public.staff_role, auth.uid()));
create policy "staff read audit questions" on public.audit_questions
  for select to authenticated using (app.is_admin() or app.has_role('coach'::public.staff_role, auth.uid()));
create policy "admins write audit versions" on public.audit_versions
  for all to authenticated using (app.is_admin()) with check (app.is_admin());
create policy "admins write audit questions" on public.audit_questions
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

-- Answers are a JSON object of question code to A, B, C or D. Validated at the boundary.
create or replace function app.valid_audit_answers(p jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(p) = 'object'
     and not exists (
       select 1 from jsonb_each(p) e
       where e.key !~ '^Q[0-9]{1,2}$'
          or jsonb_typeof(e.value) <> 'string'
          or (e.value #>> '{}') not in ('A', 'B', 'C', 'D')
     );
$$;

-- ---------------------------------------------------------------------------
-- Drafts: autosaved, one active draft per user per version.
-- ---------------------------------------------------------------------------
create table public.audit_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  version_id uuid not null references public.audit_versions (id) on delete restrict,
  answers_json jsonb not null default '{}'::jsonb check (app.valid_audit_answers(answers_json)),
  current_question int not null default 1 check (current_question between 1 and 99),
  last_saved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, version_id)
);
alter table public.audit_drafts enable row level security;

create or replace function app.touch_last_saved()
returns trigger
language plpgsql
set search_path = ''
as $$ begin new.last_saved_at := now(); return new; end; $$;
create trigger audit_drafts_touch before update on public.audit_drafts
  for each row execute function app.touch_last_saved();

create policy "read own audit draft" on public.audit_drafts
  for select to authenticated using (user_id = auth.uid());
create policy "create own audit draft" on public.audit_drafts
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and app.has_feature('audit.use'::public.feature_key, auth.uid(), now())
    and exists (select 1 from public.audit_versions v where v.id = version_id and v.status = 'published')
  );
create policy "update own audit draft" on public.audit_drafts
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and app.has_feature('audit.use'::public.feature_key, auth.uid(), now()));
create policy "delete own audit draft" on public.audit_drafts
  for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Runs: immutable scored snapshots. Inserted only by server code after deterministic scoring.
-- ---------------------------------------------------------------------------
create table public.audit_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  version_id uuid not null references public.audit_versions (id) on delete restrict,
  scoring_version text not null,
  answers_snapshot_json jsonb not null check (app.valid_audit_answers(answers_snapshot_json)),
  category_scores_json jsonb not null,
  overall_score numeric(6,3) not null check (overall_score between 0 and 100),
  assigned_path public.learning_path not null,
  recommendation_snapshot_json jsonb not null,
  submitted_at timestamptz not null default now()
);
create index audit_runs_user_idx on public.audit_runs (user_id, submitted_at desc);
alter table public.audit_runs enable row level security;
create trigger audit_runs_immutable before update on public.audit_runs
  for each row execute function app.prevent_mutation();

create policy "read own audit runs" on public.audit_runs
  for select to authenticated using (user_id = auth.uid());
create policy "admins read audit runs" on public.audit_runs
  for select to authenticated using (app.is_admin());
create policy "assigned coach reads audit runs" on public.audit_runs
  for select to authenticated using (app.is_assigned_coach(user_id));
-- No insert/update/delete policies for clients: scores cannot be forged through the API.

-- ---------------------------------------------------------------------------
-- Path overrides (D13): student or admin may choose a path; answers and scores never change.
-- ---------------------------------------------------------------------------
create table public.path_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  audit_run_id uuid references public.audit_runs (id) on delete set null,
  chosen_path public.learning_path not null,
  reason text check (reason is null or char_length(reason) <= 500),
  actor_id uuid not null references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index path_overrides_user_idx on public.path_overrides (user_id, created_at desc);
alter table public.path_overrides enable row level security;
create trigger path_overrides_append_only before update or delete on public.path_overrides
  for each row execute function app.prevent_mutation();

create policy "read own path overrides" on public.path_overrides
  for select to authenticated using (user_id = auth.uid());
create policy "student chooses own path" on public.path_overrides
  for insert to authenticated
  with check (
    user_id = auth.uid() and actor_id = auth.uid()
    and (audit_run_id is null or exists (select 1 from public.audit_runs r where r.id = audit_run_id and r.user_id = auth.uid()))
  );
create policy "admins read path overrides" on public.path_overrides
  for select to authenticated using (app.is_admin());
create policy "admins override path" on public.path_overrides
  for insert to authenticated with check (app.is_admin() and actor_id = auth.uid());

-- Effective path: latest override, else latest run's recommendation.
create or replace function public.my_current_path()
returns public.learning_path
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select o.chosen_path from public.path_overrides o where o.user_id = auth.uid() order by o.created_at desc limit 1),
    (select r.assigned_path from public.audit_runs r where r.user_id = auth.uid() order by r.submitted_at desc limit 1)
  );
$$;
revoke execute on function public.my_current_path() from public, anon;
grant execute on function public.my_current_path() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Roadmap items (advisory, never locked, preserved across retakes: D13, handoff 01)
-- ---------------------------------------------------------------------------
create type public.roadmap_state as enum ('open', 'done', 'dismissed');

create table public.roadmap_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source_audit_run_id uuid references public.audit_runs (id) on delete set null,
  month_number int not null check (month_number between 1 and 6),
  priority_order int not null check (priority_order between 1 and 50),
  title text not null check (char_length(title) between 3 and 200),
  reason text,
  recommended_module_number int check (recommended_module_number between 1 and 8),
  recommended_lesson_id uuid references public.lessons (id) on delete set null,
  state public.roadmap_state not null default 'open',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((state = 'done') = (completed_at is not null))
);
create index roadmap_items_user_idx on public.roadmap_items (user_id, month_number, priority_order);
alter table public.roadmap_items enable row level security;
create trigger roadmap_items_touch before update on public.roadmap_items for each row execute function app.touch_updated_at();

-- Students may only change the state of their own items.
create or replace function app.guard_roadmap_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_setting('role', true) = 'authenticated' and (
       new.user_id <> old.user_id or new.title <> old.title or new.month_number <> old.month_number
       or new.priority_order <> old.priority_order or new.source_audit_run_id is distinct from old.source_audit_run_id
       or new.recommended_lesson_id is distinct from old.recommended_lesson_id
       or new.recommended_module_number is distinct from old.recommended_module_number
       or new.reason is distinct from old.reason) then
    raise exception 'Only the state of a roadmap item can be changed' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger roadmap_items_guard before update on public.roadmap_items
  for each row execute function app.guard_roadmap_update();

create policy "read own roadmap" on public.roadmap_items
  for select to authenticated using (user_id = auth.uid());
create policy "update own roadmap state" on public.roadmap_items
  for update to authenticated
  using (user_id = auth.uid() and app.has_feature('roadmap.use'::public.feature_key, auth.uid(), now()))
  with check (user_id = auth.uid());
create policy "admins read roadmap" on public.roadmap_items
  for select to authenticated using (app.is_admin());
create policy "assigned coach reads roadmap" on public.roadmap_items
  for select to authenticated using (app.is_assigned_coach(user_id));

-- ---------------------------------------------------------------------------
-- Canonical audit v1 (generated from portal/src/domain/audit/v1.questions.json).
-- ---------------------------------------------------------------------------
insert into public.audit_versions (version_number, status, source_note, scoring_config_json, published_at)
values (
  1, 'draft',
  'Phase 2: 02 BOSS Business Audit and Scoring.docx (Drive id 1OfuSXorxrJO55ermW3KFx4nrrdJddvZj), imported 2026-11-01',
  '{"points": {"A": 0, "B": 1, "C": 2, "D": 3}, "overall": "mean_of_category_percentages", "na_allowed": false}'::jsonb,
  null
);
insert into public.audit_questions (version_id, question_code, number, category_code, prompt, options_json)
select v.id, q.code, q.number, q.category::public.audit_category, q.prompt, q.options::jsonb
from public.audit_versions v, (values
  ('Q1', 1, 'foundation', 'Which best describes your blogging business?', '[{"key": "A", "label": "I haven''t started."}, {"key": "B", "label": "I have a blog but no clear business."}, {"key": "C", "label": "I have a blog and offer but inconsistent sales."}, {"key": "D", "label": "I make sales and want to improve or automate."}]'),
  ('Q2', 2, 'foundation', 'How clearly can you describe your customer?', '[{"key": "A", "label": "No defined customer."}, {"key": "B", "label": "General audience."}, {"key": "C", "label": "Clear customer and problems."}, {"key": "D", "label": "Detailed customer understanding used in marketing."}]'),
  ('Q3', 3, 'foundation', 'How clear is your business promise?', '[{"key": "A", "label": "No promise."}, {"key": "B", "label": "General idea."}, {"key": "C", "label": "Clear problem and result."}, {"key": "D", "label": "Consistent message supported by feedback."}]'),
  ('Q4', 4, 'foundation', 'Do you have a digital product or offer?', '[{"key": "A", "label": "No idea."}, {"key": "B", "label": "Unvalidated idea."}, {"key": "C", "label": "Defined offer in development."}, {"key": "D", "label": "Offer for sale with sales."}]'),
  ('Q5', 5, 'brand', 'Website status?', '[{"key": "A", "label": "None."}, {"key": "B", "label": "In development."}, {"key": "C", "label": "Live and functional."}, {"key": "D", "label": "Maintained and optimized."}]'),
  ('Q6', 6, 'brand', 'Brand consistency?', '[{"key": "A", "label": "None."}, {"key": "B", "label": "Some inconsistent elements."}, {"key": "C", "label": "Mostly consistent."}, {"key": "D", "label": "Documented and consistently applied."}]'),
  ('Q7', 7, 'brand', 'Can visitors understand your offer?', '[{"key": "A", "label": "No live website."}, {"key": "B", "label": "Unclear offer."}, {"key": "C", "label": "Offer understandable."}, {"key": "D", "label": "Clear journey to purchasing."}]'),
  ('Q8', 8, 'content', 'How do you choose topics?', '[{"key": "A", "label": "No content."}, {"key": "B", "label": "Whatever comes to mind."}, {"key": "C", "label": "Audience problems."}, {"key": "D", "label": "Buyer needs, search intent and offers."}]'),
  ('Q9', 9, 'content', 'How consistently do you publish?', '[{"key": "A", "label": "Not yet."}, {"key": "B", "label": "Occasionally."}, {"key": "C", "label": "Realistic schedule."}, {"key": "D", "label": "Reliable documented workflow."}]'),
  ('Q10', 10, 'content', 'Does content connect to products?', '[{"key": "A", "label": "No content or product."}, {"key": "B", "label": "No offer links."}, {"key": "C", "label": "Some calls to action."}, {"key": "D", "label": "Intentional path to offers or signup."}]'),
  ('Q11', 11, 'content', 'Is your content process documented?', '[{"key": "A", "label": "No."}, {"key": "B", "label": "Rough routine."}, {"key": "C", "label": "Checklist."}, {"key": "D", "label": "Documented templates and QA."}]'),
  ('Q12', 12, 'marketing', 'How do you promote?', '[{"key": "A", "label": "Not yet."}, {"key": "B", "label": "Occasionally."}, {"key": "C", "label": "Active on one or two channels."}, {"key": "D", "label": "Planned distribution."}]'),
  ('Q13', 13, 'marketing', 'How do you choose channels?', '[{"key": "A", "label": "None."}, {"key": "B", "label": "Trying many."}, {"key": "C", "label": "Based on audience."}, {"key": "D", "label": "Evaluate qualified traffic and buyers."}]'),
  ('Q14', 14, 'marketing', 'What happens after publishing?', '[{"key": "A", "label": "Not publishing."}, {"key": "B", "label": "Hope for discovery."}, {"key": "C", "label": "Some promotion."}, {"key": "D", "label": "Repeatable repurposing workflow."}]'),
  ('Q15', 15, 'product', 'Product status?', '[{"key": "A", "label": "None."}, {"key": "B", "label": "Idea or outline."}, {"key": "C", "label": "In creation."}, {"key": "D", "label": "Complete and for sale."}]'),
  ('Q16', 16, 'product', 'How have you validated demand?', '[{"key": "A", "label": "No research."}, {"key": "B", "label": "Assumptions."}, {"key": "C", "label": "Customer problem research."}, {"key": "D", "label": "Direct feedback or purchase evidence."}]'),
  ('Q17', 17, 'product', 'How defined is the product outcome?', '[{"key": "A", "label": "No product."}, {"key": "B", "label": "Vague topic."}, {"key": "C", "label": "Buyer, outcome and scope clear."}, {"key": "D", "label": "Refined with feedback."}]'),
  ('Q18', 18, 'product', 'How ready is delivery?', '[{"key": "A", "label": "Not planned."}, {"key": "B", "label": "Idea only."}, {"key": "C", "label": "Method and instructions."}, {"key": "D", "label": "Tested purchase and access."}]'),
  ('Q19', 19, 'email_sales', 'How do you collect subscribers?', '[{"key": "A", "label": "No list."}, {"key": "B", "label": "Platform without effective signup."}, {"key": "C", "label": "Connected opt in."}, {"key": "D", "label": "Monitored lead system."}]'),
  ('Q20', 20, 'email_sales', 'What happens after signup?', '[{"key": "A", "label": "Nothing."}, {"key": "B", "label": "One welcome email."}, {"key": "C", "label": "Planned sequence."}, {"key": "D", "label": "Relevant automated nurture and offer sequence."}]'),
  ('Q21', 21, 'email_sales', 'Is checkout ready?', '[{"key": "A", "label": "No."}, {"key": "B", "label": "Researching."}, {"key": "C", "label": "Functional."}, {"key": "D", "label": "Fully tested."}]'),
  ('Q22', 22, 'email_sales', 'How do you track sales?', '[{"key": "A", "label": "No tracking."}, {"key": "B", "label": "Occasional checks."}, {"key": "C", "label": "Track leads and conversions."}, {"key": "D", "label": "Review and optimize regularly."}]'),
  ('Q23', 23, 'ai', 'How do you use AI?', '[{"key": "A", "label": "Not yet."}, {"key": "B", "label": "Occasionally."}, {"key": "C", "label": "Clear repeatable tasks."}, {"key": "D", "label": "Documented workflows with review."}]'),
  ('Q24', 24, 'ai', 'How much work is automated?', '[{"key": "A", "label": "None."}, {"key": "B", "label": "One or two tasks."}, {"key": "C", "label": "Several reliable tasks."}, {"key": "D", "label": "Connected workflows."}]'),
  ('Q25', 25, 'ai', 'How do you quality check?', '[{"key": "A", "label": "Not using AI."}, {"key": "B", "label": "Rarely review."}, {"key": "C", "label": "Review and test."}, {"key": "D", "label": "Documented QA and error recovery."}]'),
  ('Q26', 26, 'ai', 'How connected are your tools?', '[{"key": "A", "label": "Not selected."}, {"key": "B", "label": "Manual transfers."}, {"key": "C", "label": "Some integrations."}, {"key": "D", "label": "Reliable documented integrations."}]'),
  ('Q27', 27, 'productivity', 'How do you set weekly priorities?', '[{"key": "A", "label": "No plan."}, {"key": "B", "label": "Lists without focus."}, {"key": "C", "label": "Goals based priorities."}, {"key": "D", "label": "Consistent planned execution."}]'),
  ('Q28', 28, 'productivity', 'How do you track unfinished work?', '[{"key": "A", "label": "Memory."}, {"key": "B", "label": "Scattered notes."}, {"key": "C", "label": "Central system."}, {"key": "D", "label": "Reliable reviews and next actions."}]'),
  ('Q29', 29, 'productivity', 'How realistic is your workload?', '[{"key": "A", "label": "No routine."}, {"key": "B", "label": "Often overplan."}, {"key": "C", "label": "Plan around available time."}, {"key": "D", "label": "Consistently adjust priorities."}]'),
  ('Q30', 30, 'productivity', 'How do you review performance?', '[{"key": "A", "label": "Never."}, {"key": "B", "label": "Occasionally."}, {"key": "C", "label": "Monthly."}, {"key": "D", "label": "Regular results based decisions."}]')
) as q(code, number, category, prompt, options)
where v.version_number = 1;

update public.audit_versions set status = 'published', published_at = now() where version_number = 1;
