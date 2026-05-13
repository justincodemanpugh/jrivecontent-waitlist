-- =====================================================================
-- Gig example videos: public bucket so creators can play the example
-- videos a brand uploaded when viewing a gig. Idempotent.
-- Path convention: "{brand_id}/{uuid}.{ext}"
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('gig-examples', 'gig-examples', true)
on conflict (id) do nothing;

-- Anyone (including unauthenticated marketplace browsers in the future)
-- can read example videos — they're surfaced on the gig detail page.
drop policy if exists "Gig examples: public read" on storage.objects;
create policy "Gig examples: public read"
  on storage.objects for select
  using (bucket_id = 'gig-examples');

-- Brands can only upload into a folder named with their own user id.
drop policy if exists "Gig examples: brand insert own folder" on storage.objects;
create policy "Gig examples: brand insert own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'gig-examples'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Gig examples: brand delete own folder" on storage.objects;
create policy "Gig examples: brand delete own folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'gig-examples'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
