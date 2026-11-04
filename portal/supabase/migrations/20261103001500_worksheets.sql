-- Migration 1500: portal worksheets with saved responses (09_IMPLEMENT_WORKSHEETS, Slice A).
--
-- Owner decision 2026-11-02: worksheets live in the portal; answers save per student, export as a PDF, and are
-- visible to staff in an admin table. Adapted to this repository and the decisions register (logged as I-56):
--   * a worksheet belongs to a lesson by foreign key (lesson_id). The brief's module_slug/lesson_slug values
--     ("module-1", "lesson-1") do not exist here, so the seed resolves them to real lessons instead;
--   * status uses the existing content_status workflow (D14: draft, review, approved, published, archived);
--   * coaches read responses of their assigned members only (D09), admins read all.

create table public.worksheets (
  id uuid primary key default gen_random_uuid(),
  slug text not null check (slug ~ '^[a-z0-9-]{3,80}$'),
  version int not null default 1 check (version >= 1),
  lesson_id uuid not null references public.lessons (id) on delete restrict,
  title text not null check (char_length(title) between 3 and 200),
  schema jsonb not null check (jsonb_typeof(schema) = 'object'),
  status public.content_status not null default 'draft',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug, version)
);
-- One published version per worksheet at a time.
create unique index worksheets_one_published_idx on public.worksheets (slug) where status = 'published';
create index worksheets_lesson_idx on public.worksheets (lesson_id);
create trigger worksheets_touch before update on public.worksheets for each row execute function app.touch_updated_at();
create trigger worksheets_audit after insert or update or delete on public.worksheets for each row execute function app.audit_row_change();
alter table public.worksheets enable row level security;

-- Students see a worksheet only when it is published and its lesson is visible to them (published lesson and
-- module, active curriculum grant). Draft, review and approved worksheets are never served to students.
create or replace function app.worksheet_visible_to_student(p_slug text, p_version int)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.worksheets w
     where w.slug = p_slug and w.version = p_version and w.status = 'published'
       and app.lesson_visible_to_student(w.lesson_id)
  );
$$;

create policy "students read published worksheets" on public.worksheets
  for select to authenticated using (status = 'published' and app.lesson_visible_to_student(lesson_id));
create policy "staff read worksheets" on public.worksheets
  for select to authenticated using (app.is_staff());
create policy "admins write worksheets" on public.worksheets
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

create table public.worksheet_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  worksheet_slug text not null,
  worksheet_version int not null,
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object' and pg_column_size(answers) <= 200000),
  status text not null default 'in_progress' check (status in ('in_progress', 'complete')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, worksheet_slug),
  foreign key (worksheet_slug, worksheet_version) references public.worksheets (slug, version) on delete restrict,
  -- Completing sets completed_at; answers stay editable afterwards (the brief), so completed_at is kept once set.
  check (status = 'in_progress' or completed_at is not null)
);
create index worksheet_responses_user_idx on public.worksheet_responses (user_id);
create index worksheet_responses_slug_status_idx on public.worksheet_responses (worksheet_slug, status);
create trigger worksheet_responses_touch before update on public.worksheet_responses for each row execute function app.touch_updated_at();

-- A response stays attached to its owner and worksheet: members cannot move it to another account or worksheet.
create or replace function app.guard_worksheet_response()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id is distinct from old.user_id or new.worksheet_slug is distinct from old.worksheet_slug then
    raise exception 'A worksheet response cannot move to another account or worksheet' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger worksheet_responses_guard before update on public.worksheet_responses for each row execute function app.guard_worksheet_response();
-- Admin deletions are audited. Only deletes: the audit row then says {"deleted": true} and never copies answers
-- (worksheet answers are student personal data and are not logged).
create trigger worksheet_responses_audit_delete after delete on public.worksheet_responses for each row execute function app.audit_row_change();
alter table public.worksheet_responses enable row level security;

-- Members read their own responses always (work is never hidden from its owner, D07), and create or change them
-- only while the worksheet is visible to them. Assigned coaches and admins read; only admins delete.
create policy "read own worksheet responses" on public.worksheet_responses
  for select to authenticated using (user_id = auth.uid());
create policy "start own worksheet response" on public.worksheet_responses
  for insert to authenticated
  with check (user_id = auth.uid() and app.worksheet_visible_to_student(worksheet_slug, worksheet_version));
create policy "save own worksheet response" on public.worksheet_responses
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and app.worksheet_visible_to_student(worksheet_slug, worksheet_version));
create policy "assigned coach reads worksheet responses" on public.worksheet_responses
  for select to authenticated using (app.is_assigned_coach(user_id));
create policy "admins read worksheet responses" on public.worksheet_responses
  for select to authenticated using (app.is_admin());
create policy "admins delete worksheet responses" on public.worksheet_responses
  for delete to authenticated using (app.is_admin());
