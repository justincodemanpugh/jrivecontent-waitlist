-- =====================================================================
-- Temporarily Disable RLS to Isolate the Recursion Issue
--
-- If the error persists after disabling RLS, then the issue is not
-- in the policies but somewhere else. If it disappears, then we know
-- it's definitely a policy issue and we can debug further.
-- =====================================================================

-- Disable RLS on all briefs-related tables
alter table public.briefs disable row level security;
alter table public.brief_recipients disable row level security;
alter table public.brief_example_videos disable row level security;
alter table public.brief_submissions disable row level security;
alter table public.brief_payments disable row level security;

-- Also disable RLS on storage policies that reference briefs
-- Note: storage.objects doesn't support RLS disable/enable, so we'll drop the policies
drop policy if exists "Brief videos: brand upload" on storage.objects;
drop policy if exists "Brief videos: brand read own" on storage.objects;
drop policy if exists "Brief videos: brand delete own" on storage.objects;
drop policy if exists "Brief videos: creator read received" on storage.objects;

drop policy if exists "Brief submissions: creator upload" on storage.objects;
drop policy if exists "Brief submissions: creator read own" on storage.objects;
drop policy if exists "Brief submissions: creator delete own" on storage.objects;
drop policy if exists "Brief submissions: brand read own" on storage.objects;

-- Reload PostgREST schema to apply changes
notify pgrst, 'reload schema';
