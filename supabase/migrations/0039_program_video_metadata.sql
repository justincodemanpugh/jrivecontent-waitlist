-- =====================================================================
-- Per-video metadata for tracked videos.
--
-- The Videos dashboard could only show the creator's name and the program
-- title, so every row for a given creator looked identical. Both sync paths
-- already receive the caption (TikTok's video/list returns video_description;
-- the Apify actor returns the same text) but dropped it before writing.
--
-- cover_image_url holds TikTok's CDN cover URL. Those URLs are signed and
-- expire, so the syncs rewrite this column on every pass and the UI falls
-- back to the creator's avatar when the image fails to load.
-- =====================================================================

alter table public.program_videos
  add column if not exists description text,
  add column if not exists cover_image_url text,
  add column if not exists duration_seconds integer;

-- tracked_account_videos already has `description` (0036); it's only missing
-- the cover and duration.
alter table public.tracked_account_videos
  add column if not exists cover_image_url text,
  add column if not exists duration_seconds integer;
