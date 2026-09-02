-- =====================================================================
-- Persistent sync status for the creator's TikTok @handle fallback.
--
-- Saving creator_profiles.tiktok_handle (server action setCreatorTikTokHandle)
-- previously triggered no scrape and surfaced no feedback -- the creator UI
-- only echoed the string back, so a private/typo'd handle looked identical to
-- a working one. These columns let the immediate scrape
-- (app/api/programs/member-sync), the daily cron (app/api/programs/apify-sync)
-- and the brand's Refresh record when the handle was last checked, how many
-- public videos were found, and any scrape error, so the "Currently tracking
-- @handle" line can tell the truth. tiktok_handle_synced_at also anchors a
-- per-creator cooldown on the creator-initiated scrape.
--
-- Writers: the service-role admin client only (route + cron + refresh bypass
-- RLS). The creator still writes tiktok_handle itself through the server
-- action under the existing "Creator profiles: update own" policy, and reads
-- these columns via lib/dashboard/creator/programsApi.fetchMyTikTokHandle
-- (the select-own policy already covers every column of the caller's row).
-- =====================================================================

alter table public.creator_profiles
  add column if not exists tiktok_handle_synced_at    timestamptz,
  add column if not exists tiktok_handle_sync_error   text,
  add column if not exists tiktok_handle_video_count  integer,
  add column if not exists tiktok_handle_sync_status  text
    check (tiktok_handle_sync_status is null
           or tiktok_handle_sync_status in ('pending', 'ok', 'error', 'skipped'));

comment on column public.creator_profiles.tiktok_handle_synced_at is
  'Last Apify scrape attempt for tiktok_handle (immediate save, brand Refresh, or daily cron). Also the cooldown anchor for the creator-initiated immediate scrape.';
comment on column public.creator_profiles.tiktok_handle_sync_error is
  'Human-readable reason the last scrape attempt failed (private/nonexistent profile, actor error). NULL after a successful attempt.';
comment on column public.creator_profiles.tiktok_handle_video_count is
  'Public videos the last successful scrape found on the profile. NULL until the first success.';
comment on column public.creator_profiles.tiktok_handle_sync_status is
  'pending = saved, scrape unfinished; ok = profile public + scraped and program_videos written; error = scrape failed; skipped = handle validated but no subscribed brand, so no program_videos written.';

notify pgrst, 'reload schema';
