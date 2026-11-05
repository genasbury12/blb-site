-- The BOSS Business System
-- Migration 2400: one published worksheet per lesson. Found while testing data rights Slice D on staging: two
-- published worksheets on one lesson made the lesson page show either one. Publishing a second now fails with a clear
-- message in the admin (archive the first). Safe to run where it already exists.
create unique index if not exists worksheets_one_published_per_lesson_idx on public.worksheets (lesson_id) where status = 'published';
