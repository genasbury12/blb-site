-- The BOSS Business System
-- Migration 0300: learning catalog, lesson progress, business milestones.
-- Decisions: D14 (draft/review/approved/published/archived; only published visible; admin publishes;
-- captions/transcript required before publish; no sample media publicly visible), handoff 01 (two
-- independent kinds of progress), Phase 2 Decision 3.

create type public.content_status as enum ('draft', 'review', 'approved', 'published', 'archived');

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  number int not null unique check (number between 1 and 8),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,60}$'),
  title text not null,
  outcome text not null,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.modules enable row level security;
create trigger modules_touch before update on public.modules for each row execute function app.touch_updated_at();

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete restrict,
  slug text not null check (slug ~ '^[a-z0-9-]{3,80}$'),
  order_index int not null check (order_index between 1 and 99),
  essential boolean not null default true,
  title text not null check (char_length(title) between 3 and 140),
  objective text,
  assignment text,
  transcript text,
  video_provider text check (video_provider is null or video_provider in ('mux', 'mock')),
  video_provider_id text,
  captions_ready boolean not null default false,
  duration_seconds int check (duration_seconds is null or duration_seconds between 30 and 7200),
  is_sample boolean not null default false,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, slug),
  unique (module_id, order_index),
  -- Sample content must say so in its title.
  check (not is_sample or title like 'SAMPLE:%')
);
create index lessons_module_idx on public.lessons (module_id, order_index);
alter table public.lessons enable row level security;
create trigger lessons_touch before update on public.lessons for each row execute function app.touch_updated_at();

-- Publish gate (D14). Enforced in the database so no code path can skip it.
create or replace function app.guard_lesson_publish()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' then
    if new.is_sample and not app.config_bool('allow_sample_content') then
      raise exception 'Sample lessons cannot be published in this environment' using errcode = '23514';
    end if;
    if new.video_provider_id is not null and not new.captions_ready then
      raise exception 'Captions are required before a lesson with video is published' using errcode = '23514';
    end if;
    if new.video_provider_id is not null and coalesce(char_length(trim(new.transcript)), 0) = 0 then
      raise exception 'A transcript is required before a lesson with video is published' using errcode = '23514';
    end if;
    if tg_op = 'INSERT' or old.status is distinct from 'published' then
      new.published_at := coalesce(new.published_at, now());
    end if;
  end if;
  return new;
end;
$$;
create trigger lessons_publish_guard before insert or update on public.lessons
  for each row execute function app.guard_lesson_publish();

create table public.lesson_resources (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  label text not null,
  storage_key text not null,
  mime_type text not null check (mime_type in (
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  )),
  published boolean not null default false,
  checked_at timestamptz,
  created_at timestamptz not null default now(),
  -- D14: downloadable worksheets are checked before publishing.
  check (not published or checked_at is not null)
);
create index lesson_resources_lesson_idx on public.lesson_resources (lesson_id);
alter table public.lesson_resources enable row level security;

create or replace function app.lesson_visible_to_student(p_lesson uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.lessons l
    join public.modules m on m.id = l.module_id
    where l.id = p_lesson and l.status = 'published' and m.status = 'published'
  ) and app.has_feature('curriculum.read'::public.feature_key, auth.uid(), now());
$$;

-- Students: published content only, and only with an active curriculum grant.
create policy "students read published modules" on public.modules
  for select to authenticated
  using (status = 'published' and app.has_feature('curriculum.read'::public.feature_key, auth.uid(), now()));
create policy "students read published lessons" on public.lessons
  for select to authenticated
  using (app.lesson_visible_to_student(id));
create policy "students read published resources" on public.lesson_resources
  for select to authenticated
  using (published and app.lesson_visible_to_student(lesson_id));

-- Staff: coaches read everything to suggest edits; only admins write (D14).
create policy "staff read modules" on public.modules
  for select to authenticated using (app.is_admin() or app.has_role('coach'::public.staff_role, auth.uid()));
create policy "staff read lessons" on public.lessons
  for select to authenticated using (app.is_admin() or app.has_role('coach'::public.staff_role, auth.uid()));
create policy "staff read resources" on public.lesson_resources
  for select to authenticated using (app.is_admin() or app.has_role('coach'::public.staff_role, auth.uid()));
create policy "admins write modules" on public.modules
  for all to authenticated using (app.is_admin()) with check (app.is_admin());
create policy "admins write lessons" on public.lessons
  for all to authenticated using (app.is_admin()) with check (app.is_admin());
create policy "admins write resources" on public.lesson_resources
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

-- ---------------------------------------------------------------------------
-- Learning progress (lesson completion)
-- ---------------------------------------------------------------------------
create table public.lesson_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
create index lesson_progress_lesson_idx on public.lesson_progress (lesson_id);
alter table public.lesson_progress enable row level security;

create policy "read own lesson progress" on public.lesson_progress
  for select to authenticated using (user_id = auth.uid());
create policy "mark own visible lesson complete" on public.lesson_progress
  for insert to authenticated
  with check (user_id = auth.uid() and app.lesson_visible_to_student(lesson_id));
create policy "unmark own lesson" on public.lesson_progress
  for delete to authenticated using (user_id = auth.uid());
create policy "admins read lesson progress" on public.lesson_progress
  for select to authenticated using (app.is_admin());
create policy "assigned coach reads lesson progress" on public.lesson_progress
  for select to authenticated using (app.is_assigned_coach(user_id));

-- ---------------------------------------------------------------------------
-- Business implementation milestones (separate from lesson completion)
-- ---------------------------------------------------------------------------
create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete restrict,
  slug text not null check (slug ~ '^[a-z0-9-]{3,80}$'),
  title text not null,
  order_index int not null,
  evidence_policy text not null default 'optional' check (evidence_policy in ('none', 'optional')),
  is_sample boolean not null default false,
  status public.content_status not null default 'draft',
  unique (module_id, slug),
  check (not is_sample or title like 'SAMPLE:%')
);
alter table public.milestones enable row level security;
create policy "students read published milestones" on public.milestones
  for select to authenticated
  using (status = 'published' and app.has_feature('curriculum.read'::public.feature_key, auth.uid(), now()));
create policy "staff read milestones" on public.milestones
  for select to authenticated using (app.is_admin() or app.has_role('coach'::public.staff_role, auth.uid()));
create policy "admins write milestones" on public.milestones
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

create type public.milestone_state as enum ('not_started', 'in_progress', 'done');

create table public.milestone_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  milestone_id uuid not null references public.milestones (id) on delete cascade,
  state public.milestone_state not null default 'in_progress',
  completed_at timestamptz,
  evidence_storage_key text,
  note text check (note is null or char_length(note) <= 2000),
  updated_at timestamptz not null default now(),
  primary key (user_id, milestone_id),
  check ((state = 'done') = (completed_at is not null))
);
alter table public.milestone_progress enable row level security;
create trigger milestone_progress_touch before update on public.milestone_progress for each row execute function app.touch_updated_at();

create or replace function app.milestone_visible_to_student(p_milestone uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.milestones m where m.id = p_milestone and m.status = 'published')
    and app.has_feature('curriculum.read'::public.feature_key, auth.uid(), now());
$$;

create policy "read own milestone progress" on public.milestone_progress
  for select to authenticated using (user_id = auth.uid());
create policy "write own milestone progress" on public.milestone_progress
  for insert to authenticated with check (user_id = auth.uid() and app.milestone_visible_to_student(milestone_id));
create policy "update own milestone progress" on public.milestone_progress
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and app.milestone_visible_to_student(milestone_id));
create policy "admins read milestone progress" on public.milestone_progress
  for select to authenticated using (app.is_admin());
create policy "assigned coach reads milestone progress" on public.milestone_progress
  for select to authenticated using (app.is_assigned_coach(user_id));

-- Approved module titles and outcomes (Phase 2 Decision 4). Draft until real lessons exist.
insert into public.modules (number, slug, title, outcome) values
  (1, 'business-foundation',         'Business Foundation',         'Business model, audience, offer direction and messaging.'),
  (2, 'brand-and-website',           'Brand & Website',             'Professional website and customer journey.'),
  (3, 'content-production-engine',   'Content Production Engine',   'Repeatable sales aligned blogging workflow.'),
  (4, 'marketing-and-distribution',  'Marketing & Distribution',    'Sustainable content promotion.'),
  (5, 'digital-product-development', 'Digital Product Development', 'Sellable digital product and delivery method.'),
  (6, 'email-and-sales-systems',     'Email & Sales Systems',       'Working email funnel, checkout and delivery.'),
  (7, 'ai-and-automation-hub',       'AI & Automation Hub',         'Tested workflows that reduce repetitive tasks.'),
  (8, 'ceo-productivity-system',     'CEO Productivity System',     'Manageable planning, execution and measurement.');
