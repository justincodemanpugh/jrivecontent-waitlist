-- =====================================================================
-- Gig cover images: public bucket + column on `gigs`. Idempotent.
-- =====================================================================

alter table public.gigs
  add column if not exists cover_image_url text;

-- Public bucket so cards can render <img src=…> without signed URLs.
insert into storage.buckets (id, name, public)
values ('gig-covers', 'gig-covers', true)
on conflict (id) do nothing;

-- Anyone can read covers — they're displayed on the creator marketplace.
drop policy if exists "Gig covers: public read" on storage.objects;
create policy "Gig covers: public read"
  on storage.objects for select
  using (bucket_id = 'gig-covers');

-- Brands can only upload into a folder named with their own user id,
-- e.g. "{brand_id}/{uuid}.jpg".
drop policy if exists "Gig covers: brand insert own folder" on storage.objects;
create policy "Gig covers: brand insert own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'gig-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Gig covers: brand delete own folder" on storage.objects;
create policy "Gig covers: brand delete own folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'gig-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
