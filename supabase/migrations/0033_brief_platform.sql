-- =====================================================================
-- Briefs: single target platform.
--
-- Adds a `platform` column to `briefs` so a brand can tell creators which
-- platform the video is for. Optional (nullable). One platform per brief:
--   'tiktok' | 'instagram' | 'youtube' | 'all'
--
-- Note: the legacy `deadline` column is intentionally left in place
-- (nullable, unused by the UI) to avoid breaking existing queries/records.
-- =====================================================================

alter table public.briefs
  add column if not exists platform text;

notify pgrst, 'reload schema';
