-- =====================================================================
-- Re-enable Briefs RLS Safely (No Recursion)
--
-- Root cause of the earlier "infinite recursion" error:
--   The `briefs` policy queried `brief_recipients`, and the
--   `brief_recipients` policy queried `briefs`. Each table's policy
--   triggered the other's policy, looping forever.
--
-- Fix:
--   Use SECURITY DEFINER helper functions to perform ownership/membership
--   checks. A SECURITY DEFINER function runs as its owner and BYPASSES RLS
--   on the tables it reads, so the cross-table checks no longer re-trigger
--   the policies that caused the loop.
-- =====================================================================


-- ---------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER => bypass RLS inside the check).
-- ---------------------------------------------------------------------

-- Is the given user the brand owner of this brief?
create or replace function public.is_brief_brand(p_brief_id uuid, p_uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.briefs b
    where b.id = p_brief_id and b.brand_id = p_uid
  );
$$;

-- Is the given user a recipient (creator) of this brief?
create or replace function public.is_brief_recipient(p_brief_id uuid, p_uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.brief_recipients br
    where br.brief_id = p_brief_id and br.creator_id = p_uid
  );
$$;

-- Is the given user the creator on this brief_recipient row?
create or replace function public.is_recipient_creator(p_recipient_id uuid, p_uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.brief_recipients br
    where br.id = p_recipient_id and br.creator_id = p_uid
  );
$$;

-- Is the given user the brand that owns the brief behind this recipient row?
create or replace function public.is_recipient_brand(p_recipient_id uuid, p_uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.brief_recipients br
    join public.briefs b on b.id = br.brief_id
    where br.id = p_recipient_id and b.brand_id = p_uid
  );
$$;

-- Can the creator read this brief-videos storage object (example video)?
create or replace function public.can_creator_read_brief_video(p_name text, p_uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.brief_example_videos bev
    join public.brief_recipients br on br.brief_id = bev.brief_id
    where bev.storage_path = p_name and br.creator_id = p_uid
  );
$$;

-- Can the brand read this brief-submissions storage object (creator upload)?
create or replace function public.can_brand_read_submission(p_name text, p_uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.brief_recipients br
    join public.briefs b on b.id = br.brief_id
    where br.submission_storage_path = p_name and b.brand_id = p_uid
  );
$$;

grant execute on function public.is_brief_brand(uuid, uuid)              to authenticated;
grant execute on function public.is_brief_recipient(uuid, uuid)          to authenticated;
grant execute on function public.is_recipient_creator(uuid, uuid)        to authenticated;
grant execute on function public.is_recipient_brand(uuid, uuid)          to authenticated;
grant execute on function public.can_creator_read_brief_video(text, uuid) to authenticated;
grant execute on function public.can_brand_read_submission(text, uuid)    to authenticated;


-- ---------------------------------------------------------------------
-- Re-enable RLS on all briefs tables.
-- ---------------------------------------------------------------------

alter table public.briefs               enable row level security;
alter table public.brief_recipients     enable row level security;
alter table public.brief_example_videos enable row level security;
alter table public.brief_submissions    enable row level security;
alter table public.brief_payments       enable row level security;


-- ---------------------------------------------------------------------
-- briefs
-- ---------------------------------------------------------------------

drop policy if exists "Briefs: brand manage own" on public.briefs;
create policy "Briefs: brand manage own"
  on public.briefs for all
  using (auth.uid() = brand_id)
  with check (auth.uid() = brand_id);

drop policy if exists "Briefs: creator read received" on public.briefs;
create policy "Briefs: creator read received"
  on public.briefs for select
  using (public.is_brief_recipient(id, auth.uid()));


-- ---------------------------------------------------------------------
-- brief_recipients
-- ---------------------------------------------------------------------

drop policy if exists "Brief recipients: brand manage own" on public.brief_recipients;
create policy "Brief recipients: brand manage own"
  on public.brief_recipients for all
  using (public.is_brief_brand(brief_id, auth.uid()))
  with check (public.is_brief_brand(brief_id, auth.uid()));

drop policy if exists "Brief recipients: creator read own" on public.brief_recipients;
create policy "Brief recipients: creator read own"
  on public.brief_recipients for select
  using (auth.uid() = creator_id);

drop policy if exists "Brief recipients: creator update own" on public.brief_recipients;
create policy "Brief recipients: creator update own"
  on public.brief_recipients for update
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);


-- ---------------------------------------------------------------------
-- brief_example_videos
-- ---------------------------------------------------------------------

drop policy if exists "Brief example videos: brand manage own" on public.brief_example_videos;
create policy "Brief example videos: brand manage own"
  on public.brief_example_videos for all
  using (public.is_brief_brand(brief_id, auth.uid()))
  with check (public.is_brief_brand(brief_id, auth.uid()));

drop policy if exists "Brief example videos: creator read received" on public.brief_example_videos;
create policy "Brief example videos: creator read received"
  on public.brief_example_videos for select
  using (public.is_brief_recipient(brief_id, auth.uid()));


-- ---------------------------------------------------------------------
-- brief_submissions
-- ---------------------------------------------------------------------

drop policy if exists "Brief submissions: creator manage own" on public.brief_submissions;
create policy "Brief submissions: creator manage own"
  on public.brief_submissions for all
  using (public.is_recipient_creator(brief_recipient_id, auth.uid()))
  with check (public.is_recipient_creator(brief_recipient_id, auth.uid()));

drop policy if exists "Brief submissions: brand read own" on public.brief_submissions;
create policy "Brief submissions: brand read own"
  on public.brief_submissions for select
  using (public.is_recipient_brand(brief_recipient_id, auth.uid()));


-- ---------------------------------------------------------------------
-- brief_payments (simple ownership columns, no recursion risk)
-- ---------------------------------------------------------------------

drop policy if exists "Brief payments: members read" on public.brief_payments;
create policy "Brief payments: members read"
  on public.brief_payments for select
  using (auth.uid() = brand_id or auth.uid() = creator_id);


-- ---------------------------------------------------------------------
-- Storage: brief-videos bucket (example videos uploaded by brand).
-- Path: {brand_id}/{brief_id}/{uuid}.{ext}
-- ---------------------------------------------------------------------

drop policy if exists "Brief videos: brand upload" on storage.objects;
create policy "Brief videos: brand upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'brief-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Brief videos: brand read own" on storage.objects;
create policy "Brief videos: brand read own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'brief-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Brief videos: brand delete own" on storage.objects;
create policy "Brief videos: brand delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'brief-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Brief videos: creator read received" on storage.objects;
create policy "Brief videos: creator read received"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'brief-videos'
    and public.can_creator_read_brief_video(name, auth.uid())
  );


-- ---------------------------------------------------------------------
-- Storage: brief-submissions bucket (videos uploaded by creator).
-- Path: {creator_id}/{brief_recipient_id}/{uuid}.{ext}
-- ---------------------------------------------------------------------

drop policy if exists "Brief submissions: creator upload" on storage.objects;
create policy "Brief submissions: creator upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'brief-submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Brief submissions: creator read own" on storage.objects;
create policy "Brief submissions: creator read own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'brief-submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Brief submissions: creator delete own" on storage.objects;
create policy "Brief submissions: creator delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'brief-submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Brief submissions: brand read own" on storage.objects;
create policy "Brief submissions: brand read own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'brief-submissions'
    and public.can_brand_read_submission(name, auth.uid())
  );


notify pgrst, 'reload schema';
