-- The BOSS Business System
-- Migration 0700: Implementation Library (blueprint section 4, Phase 2 navigation). Separate searchable
-- library of walkthroughs, recipes, prompts, templates and troubleshooting, linked to modules.

create type public.library_kind as enum ('walkthrough', 'tutorial', 'automation_recipe', 'ai_prompt', 'template', 'troubleshooting');

create table public.library_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,80}$'),
  title text not null check (char_length(title) between 3 and 140),
  kind public.library_kind not null,
  summary text not null check (char_length(summary) between 3 and 400),
  body text check (body is null or char_length(body) <= 20000),
  external_url text check (external_url is null or external_url ~ '^https://'),
  tool_cost_note text check (tool_cost_note is null or char_length(tool_cost_note) <= 400),
  module_number int check (module_number between 1 and 8),
  tags text[] not null default '{}',
  storage_key text,
  mime_type text,
  is_sample boolean not null default false,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not is_sample or title like 'SAMPLE:%')
);
create index library_items_module_idx on public.library_items (module_number);
alter table public.library_items enable row level security;
create trigger library_items_touch before update on public.library_items for each row execute function app.touch_updated_at();
create trigger library_items_audit after insert or update or delete on public.library_items for each row execute function app.audit_row_change();

create or replace function app.guard_library_publish()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' then
    if new.is_sample and not app.config_bool('allow_sample_content') then
      raise exception 'Sample lessons cannot be published in this environment' using errcode = '23514';
    end if;
    if tg_op = 'INSERT' or old.status is distinct from 'published' then
      new.published_at := coalesce(new.published_at, now());
    end if;
  end if;
  return new;
end;
$$;
create trigger library_items_publish_guard before insert or update on public.library_items
  for each row execute function app.guard_library_publish();

create policy "members read published library" on public.library_items
  for select to authenticated
  using (status = 'published' and app.has_feature('library.read'::public.feature_key, auth.uid(), now()));
create policy "staff read library" on public.library_items
  for select to authenticated using (app.is_admin() or app.has_role('coach'::public.staff_role, auth.uid()));
create policy "admins write library" on public.library_items
  for all to authenticated using (app.is_admin()) with check (app.is_admin());
