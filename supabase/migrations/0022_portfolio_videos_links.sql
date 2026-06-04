-- =====================================================================
-- Portfolio videos: add thumbnail_path, drop engagement metrics.
--
-- The live table already has platform, video_url, thumbnail_url, title,
-- views, likes, comments (from 0021). We only need to:
--   * Add thumbnail_path for uploaded thumbnails
--   * Drop views/likes/comments (brands can see them on the platform)
--   * Add social account verification flags (originally intended by 0021)
-- =====================================================================

-- Add thumbnail_path for uploaded thumbnails (distinct from thumbnail_url)
alter table public.creator_portfolio_videos
  add column if not exists thumbnail_path text;

-- Drop engagement metrics columns
alter table public.creator_portfolio_videos
  drop column if exists views,
  drop column if exists likes,
  drop column if exists comments;

-- Social account verification flags (originally intended by 0021, never
-- applied because that migration was a no-op).
alter table public.creator_profiles
  add column if not exists instagram_verified boolean not null default false,
  add column if not exists tiktok_verified boolean not null default false,
  add column if not exists youtube_verified boolean not null default false;

notify pgrst, 'reload schema';
