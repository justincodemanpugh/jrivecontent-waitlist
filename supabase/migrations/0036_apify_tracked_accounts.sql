-- =====================================================================
-- Apify-based TikTok tracking.
--
-- TikTok's official Display API (used by app/api/programs/tiktok-sync)
-- requires each creator to OAuth-connect their account, which only works
-- once the TikTok app itself passes TikTok's app review. Until then no
-- real metrics can flow in.
--
-- This migration adds the storage for a second, OAuth-free data source
-- (Apify's public TikTok scraper), used by
-- app/api/programs/apify-sync/route.js:
--
--   * `creator_profiles.tiktok_handle` — a creator can just type their
--     @handle instead of completing the OAuth flow. Idempotent: the
--     column is already referenced by lib/dashboard/brand/programsApi.js
--     and may pre-date the migration history.
--   * `tracked_accounts` — arbitrary TikTok accounts a brand wants to
--     watch, independent of whether that person is a registered creator
--     or a member of any program.
--   * `tracked_account_videos` / `tracked_account_video_snapshots` —
--     mirror of program_videos / program_video_metric_snapshots (0034)
--     for those brand-tracked accounts.
--
-- Program-member metrics keep flowing into the existing
-- program_videos / program_video_metric_snapshots tables, so the brand
-- dashboard keeps working unchanged and swapping back to the official
-- API later needs no schema change.
-- =====================================================================


-- ---------------------------------------------------------------------
-- Creator's TikTok handle (OAuth-free fallback).
-- ---------------------------------------------------------------------

alter table public.creator_profiles
  add column if not exists tiktok_handle text;


-- ---------------------------------------------------------------------
-- Tracked Accounts: a TikTok account a brand wants metrics for.
-- Rows are written by the brand (RLS) and synced by the apify-sync cron
-- using the admin client (service role), which bypasses RLS.
-- ---------------------------------------------------------------------

create table if not exists public.tracked_accounts (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references auth.users(id) on delete cascade,
  platform text not null default 'tiktok', -- tiktok (more platforms later)
  username text not null,                  -- normalized, no leading '@'
  video_limit integer not null default 30, -- how many recent videos to pull
  status text not null default 'pending',  -- pending | tracking | error
  last_error text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, platform, username)
);

create index if not exists tracked_accounts_brand_idx
  on public.tracked_accounts(brand_id, created_at desc);

drop trigger if exists tracked_accounts_set_updated_at on public.tracked_accounts;
create trigger tracked_accounts_set_updated_at
before update on public.tracked_accounts
for each row execute function public.set_updated_at();

alter table public.tracked_accounts enable row level security;

drop policy if exists "Tracked accounts: brand manage own" on public.tracked_accounts;
create policy "Tracked accounts: brand manage own"
  on public.tracked_accounts for all
  using (auth.uid() = brand_id)
  with check (auth.uid() = brand_id);


-- ---------------------------------------------------------------------
-- Tracked Account Videos: mirrors program_videos (0034).
-- ---------------------------------------------------------------------

create table if not exists public.tracked_account_videos (
  id uuid primary key default gen_random_uuid(),
  tracked_account_id uuid not null references public.tracked_accounts(id) on delete cascade,
  platform_video_id text not null,
  video_url text,
  description text,
  posted_at timestamptz,
  first_synced_at timestamptz not null default now(),
  last_synced_at timestamptz not null default now(),
  views integer not null default 0,
  likes integer not null default 0,
  comments integer not null default 0,
  shares integer not null default 0,
  created_at timestamptz not null default now(),
  unique (tracked_account_id, platform_video_id)
);

create index if not exists tracked_account_videos_account_idx
  on public.tracked_account_videos(tracked_account_id, posted_at desc);

alter table public.tracked_account_videos enable row level security;

drop policy if exists "Tracked account videos: brand read own" on public.tracked_account_videos;
create policy "Tracked account videos: brand read own"
  on public.tracked_account_videos for select
  using (
    exists (
      select 1 from public.tracked_accounts ta
      where ta.id = tracked_account_videos.tracked_account_id
        and ta.brand_id = auth.uid()
    )
  );


-- ---------------------------------------------------------------------
-- Tracked Account Video Snapshots: time series. Insert-only.
-- Mirrors program_video_metric_snapshots (0034).
-- ---------------------------------------------------------------------

create table if not exists public.tracked_account_video_snapshots (
  id uuid primary key default gen_random_uuid(),
  tracked_account_video_id uuid not null
    references public.tracked_account_videos(id) on delete cascade,
  views integer not null default 0,
  likes integer not null default 0,
  comments integer not null default 0,
  shares integer not null default 0,
  captured_at timestamptz not null default now()
);

create index if not exists tracked_account_video_snapshots_video_idx
  on public.tracked_account_video_snapshots(tracked_account_video_id, captured_at desc);

alter table public.tracked_account_video_snapshots enable row level security;

drop policy if exists "Tracked account snapshots: brand read own"
  on public.tracked_account_video_snapshots;
create policy "Tracked account snapshots: brand read own"
  on public.tracked_account_video_snapshots for select
  using (
    exists (
      select 1 from public.tracked_account_videos tav
      join public.tracked_accounts ta on ta.id = tav.tracked_account_id
      where tav.id = tracked_account_video_snapshots.tracked_account_video_id
        and ta.brand_id = auth.uid()
    )
  );


notify pgrst, 'reload schema';
