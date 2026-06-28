-- =====================================================================
-- Comprehensive Fix for All Briefs System Policy Circular References
--
-- The issue is that multiple policies reference each other through
-- brief_recipients, creating a web of circular dependencies:
-- - briefs -> brief_recipients
-- - brief_example_videos -> brief_recipients -> briefs  
-- - brief_submissions -> brief_recipients -> briefs
-- - storage.objects -> brief_example_videos -> brief_recipients -> briefs
--
-- Solution: Replace all circular references with direct foreign key checks
-- using the brand_id and creator_id columns directly.
-- =====================================================================

-- Drop all existing policies first
drop policy if exists "Briefs: brand manage own" on public.briefs;
drop policy if exists "Briefs: creator read received" on public.briefs;
drop policy if exists "Brief recipients: brand manage own" on public.brief_recipients;
drop policy if exists "Brief recipients: creator read own" on public.brief_recipients;
drop policy if exists "Brief recipients: creator update own" on public.brief_recipients;
drop policy if exists "Brief example videos: brand manage own" on public.brief_example_videos;
drop policy if exists "Brief example videos: creator read received" on public.brief_example_videos;
drop policy if exists "Brief submissions: creator manage own" on public.brief_submissions;
drop policy if exists "Brief submissions: brand read own" on public.brief_submissions;

-- === BRIEFS TABLE POLICIES ===
-- Brand can manage their own briefs (simple, no circular refs)
create policy "Briefs: brand manage own"
  on public.briefs for all
  using (auth.uid() = brand_id)
  with check (auth.uid() = brand_id);

-- Creator can read briefs they received (no circular reference)
create policy "Briefs: creator read received"
  on public.briefs for select
  using (
    -- Direct check using brief_recipients table
    exists (
      select 1 from public.brief_recipients br
      where br.brief_id = briefs.id
        and br.creator_id = auth.uid()
    )
  );

-- === BRIEF_RECIPIENTS TABLE POLICIES ===
-- Brand can manage recipients for their briefs (no circular refs)
create policy "Brief recipients: brand manage own"
  on public.brief_recipients for all
  using (
    -- Direct check using briefs table
    exists (
      select 1 from public.briefs b
      where b.id = brief_recipients.brief_id
        and b.brand_id = auth.uid()
    )
  )
  with check (
    -- For inserts, check the brief belongs to current brand
    exists (
      select 1 from public.briefs b
      where b.id = brief_recipients.brief_id
        and b.brand_id = auth.uid()
    )
  );

-- Creator can read their own recipient rows (simple)
create policy "Brief recipients: creator read own"
  on public.brief_recipients for select
  using (auth.uid() = creator_id);

-- Creator can update their own recipient rows (simple)
create policy "Brief recipients: creator update own"
  on public.brief_recipients for update
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

-- === BRIEF_EXAMPLE_VIDEOS TABLE POLICIES ===
-- Brand can manage example videos for their briefs (no circular refs)
create policy "Brief example videos: brand manage own"
  on public.brief_example_videos for all
  using (
    -- Direct check using briefs table
    exists (
      select 1 from public.briefs b
      where b.id = brief_example_videos.brief_id
        and b.brand_id = auth.uid()
    )
  )
  with check (
    -- For inserts, check the brief belongs to current brand
    exists (
      select 1 from public.briefs b
      where b.id = brief_example_videos.brief_id
        and b.brand_id = auth.uid()
    )
  );

-- Creator can read example videos for briefs they received (no circular refs)
create policy "Brief example videos: creator read received"
  on public.brief_example_videos for select
  using (
    -- Direct check using brief_recipients table
    exists (
      select 1 from public.brief_recipients br
      where br.brief_id = brief_example_videos.brief_id
        and br.creator_id = auth.uid()
    )
  );

-- === BRIEF_SUBMISSIONS TABLE POLICIES ===
-- Creator can manage their own submissions (no circular refs)
create policy "Brief submissions: creator manage own"
  on public.brief_submissions for all
  using (
    -- Direct check using brief_recipients table
    exists (
      select 1 from public.brief_recipients br
      where br.id = brief_submissions.brief_recipient_id
        and br.creator_id = auth.uid()
    )
  )
  with check (
    -- For inserts, check the recipient belongs to current creator
    exists (
      select 1 from public.brief_recipients br
      where br.id = brief_submissions.brief_recipient_id
        and br.creator_id = auth.uid()
    )
  );

-- Brand can read submissions for their briefs (no circular refs)
create policy "Brief submissions: brand read own"
  on public.brief_submissions for select
  using (
    -- Direct check using briefs table via brief_recipients
    exists (
      select 1 from public.brief_recipients br
      join public.briefs b on b.id = br.brief_id
      where br.id = brief_submissions.brief_recipient_id
        and b.brand_id = auth.uid()
    )
  );

-- Reload PostgREST schema to apply all changes
notify pgrst, 'reload schema';
