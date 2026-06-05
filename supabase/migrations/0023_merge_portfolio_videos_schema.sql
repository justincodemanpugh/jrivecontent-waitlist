-- =====================================================================
-- Add missing columns to creator_portfolio_videos for backward compatibility
-- 
-- This migration adds the old schema columns (storage_path, mime_type, etc.)
-- to the existing table so both legacy uploaded videos and new social media
-- links can coexist without data loss.
-- =====================================================================

-- Add legacy uploaded video columns to support existing data
alter table public.creator_portfolio_videos
  add column if not exists storage_path text,
  add column if not exists mime_type text,
  add column if not exists size_bytes bigint,
  add column if not exists position integer not null default 0;

-- Add index for position if it doesn't exist
create index if not exists creator_portfolio_videos_position_idx 
  on public.creator_portfolio_videos(position);

-- Make the video_url and platform columns nullable to allow uploaded files
alter table public.creator_portfolio_videos
  alter column video_url drop not null,
  alter column platform drop not null;

notify pgrst, 'reload schema';
