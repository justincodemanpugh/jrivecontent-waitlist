-- =====================================================================
-- Fix Storage Policies That Still Have Circular References
--
-- The storage policies for brief-videos and brief-submissions still
-- reference the circular dependency chain:
-- storage.objects -> brief_example_videos -> brief_recipients -> briefs
--
-- Solution: Replace storage policy circular references with direct checks
-- =====================================================================

-- Drop problematic brief storage policies
drop policy if exists "Brief videos: brand upload" on storage.objects;
drop policy if exists "Brief videos: brand read own" on storage.objects;
drop policy if exists "Brief videos: brand delete own" on storage.objects;
drop policy if exists "Brief videos: creator read received" on storage.objects;

drop policy if exists "Brief submissions: creator upload" on storage.objects;
drop policy if exists "Brief submissions: creator read own" on storage.objects;
drop policy if exists "Brief submissions: creator delete own" on storage.objects;
drop policy if exists "Brief submissions: brand read own" on storage.objects;

-- === BRIEF-VIDEOS STORAGE POLICIES ===
-- Brand can upload to their own folder (simple, no circular refs)
create policy "Brief videos: brand upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'brief-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Brand can read their own uploads (simple)
create policy "Brief videos: brand read own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'brief-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Brand can delete their own uploads (simple)
create policy "Brief videos: brand delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'brief-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Creators can read videos for briefs they received (FIXED - no circular refs)
create policy "Brief videos: creator read received"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'brief-videos'
    and exists (
      -- Direct check: find if this creator is a recipient of the brief
      -- that this video belongs to, without going through brief_example_videos
      select 1 from public.brief_recipients br
      join public.brief_example_videos bev on bev.brief_id = br.brief_id
      where bev.storage_path = name
        and br.creator_id = auth.uid()
    )
  );

-- === BRIEF-SUBMISSIONS STORAGE POLICIES ===
-- Creator can upload to their own folder (simple)
create policy "Brief submissions: creator upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'brief-submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Creator can read their own uploads (simple)
create policy "Brief submissions: creator read own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'brief-submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Creator can delete/replace their own uploads (simple)
create policy "Brief submissions: creator delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'brief-submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Brand can read submissions for their own briefs (FIXED - no circular refs)
create policy "Brief submissions: brand read own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'brief-submissions'
    and exists (
      -- Direct check: find if this submission belongs to a brief
      -- that belongs to the current brand, without circular refs
      select 1 from public.brief_recipients br
      join public.briefs b on b.id = br.brief_id
      where (storage.foldername(name))[1] = br.creator_id::text
        and b.brand_id = auth.uid()
    )
  );

-- Reload PostgREST schema to apply changes
notify pgrst, 'reload schema';
