-- LOCAL AND TEST ONLY (supabase db reset / npm run test:db). Never run against production.
-- Everything here is SAMPLE content so the portal can be exercised before real training exists.
-- Contract rule: no fabricated course content. Titles say SAMPLE and bodies say placeholder.

insert into public.app_config (key, value) values ('allow_sample_content', 'true'::jsonb)
on conflict (key) do update set value = excluded.value;

update public.modules set status = 'published';

-- Module 1: seven SAMPLE lessons so the approved Module 1 audit mapping (lessons 1 to 7) can be exercised.
insert into public.lessons (module_id, slug, order_index, essential, title, objective, assignment, is_sample, status)
select m.id, 'sample-lesson-' || n, n, true,
       'SAMPLE: Module 1 lesson ' || n,
       'Placeholder objective. Real lesson content is pending production.',
       'Placeholder assignment. Real assignment is pending production.',
       true, 'published'
from public.modules m, generate_series(1, 7) n
where m.number = 1;

-- Modules 2 to 8: two SAMPLE lessons each (one essential, one optional tutorial).
insert into public.lessons (module_id, slug, order_index, essential, title, objective, assignment, is_sample, status)
select m.id, 'sample-lesson-' || n, n, n = 1,
       'SAMPLE: Module ' || m.number || ' lesson ' || n,
       'Placeholder objective. Real lesson content is pending production.',
       'Placeholder assignment. Real assignment is pending production.',
       true, 'published'
from public.modules m, generate_series(1, 2) n
where m.number between 2 and 8;

-- A draft lesson that students must never see.
insert into public.lessons (module_id, slug, order_index, essential, title, is_sample, status)
select m.id, 'sample-draft-lesson', 9, true, 'SAMPLE: Draft lesson (hidden from students)', true, 'draft'
from public.modules m where m.number = 1;

-- One SAMPLE milestone per module.
insert into public.milestones (module_id, slug, title, order_index, is_sample, status)
select m.id, 'sample-milestone', 'SAMPLE: Module ' || m.number || ' milestone', 1, true, 'published'
from public.modules m;

-- SAMPLE Implementation Library items (local and test only).
insert into public.library_items (slug, title, kind, summary, module_number, tags, is_sample, status) values
  ('sample-walkthrough', 'SAMPLE: Platform walkthrough placeholder', 'walkthrough', 'Placeholder summary. Real walkthrough is pending production.', 2, '{sample}', true, 'published'),
  ('sample-prompt', 'SAMPLE: AI prompt placeholder', 'ai_prompt', 'Placeholder summary. Real prompt is pending production.', 7, '{sample,ai}', true, 'published'),
  ('sample-draft-item', 'SAMPLE: Draft library item (hidden)', 'template', 'Placeholder summary for a draft item.', 5, '{sample}', true, 'draft');
