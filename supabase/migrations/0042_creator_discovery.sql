-- =====================================================================
-- Public creator discovery directory (/creators).
--
-- Everything else in this schema is private to a brand or a creator. This
-- migration is the deliberate exception: `discovered_creators` and their
-- sample videos are readable by ANON, because they back the public,
-- unauthenticated /creators page that exists to bring brands in.
--
-- These rows describe TikTok accounts that have NOT signed up. They are
-- scraped public profile data (Apify, see lib/apify/tiktokScraper.js),
-- not members: they cannot be invited, briefed, or paid, and nothing here
-- feeds programs / program_payouts. The page links out to tiktok.com.
--
-- Filled by app/api/discovery/seed/route.js (keyword search, billed per
-- video) and kept current by app/api/discovery/refresh/route.js (billed
-- per profile, ~2x cheaper — never refresh via the video scraper).
-- =====================================================================


-- ---------------------------------------------------------------------
-- Discovered creators.
--
-- Written only by the seed/refresh crons via the service-role client.
--
-- On engagement metrics: a keyword search yields ~1.15 videos per unique
-- creator (measured), so an avg_views built from that sample is really
-- "views of one video" and badly misrepresents people — an 82k-follower
-- account sampled on a dud video looked like 133 avg views. So the
-- primary signal is avg_likes_per_video, derived from the account's
-- LIFETIME heart/video totals, and avg_views is nullable and only set
-- once sample_video_count is high enough to mean anything.
-- ---------------------------------------------------------------------

create table if not exists public.discovered_creators (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'tiktok',
  username text not null,             -- normalized, no leading '@'
  platform_user_id text,              -- authorMeta.id, stable across renames
  nickname text,
  avatar_url text,                    -- signed + expiring; re-stored each pass
  bio text,                           -- authorMeta.signature
  bio_link text,                      -- authorMeta.bioLink, often how brands reach them
  follower_count integer not null default 0,
  following_count integer not null default 0,
  total_likes bigint not null default 0,   -- lifetime; can exceed int4
  video_count integer not null default 0,
  avg_likes_per_video integer not null default 0,
  avg_views integer,                  -- null until we have a real sample
  sample_video_count integer not null default 0,
  verified boolean not null default false,
  niche_tags text[] not null default '{}',
  discovered_via text,                -- keyword that surfaced them
  last_scraped_at timestamptz,
  hidden boolean not null default false,   -- opt-out; never un-set by a sync
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform, username)
);

-- Sort/filter paths for the public directory. Partial on `hidden` because
-- every public query carries `hidden = false`.
create index if not exists discovered_creators_followers_idx
  on public.discovered_creators(follower_count desc) where hidden = false;

create index if not exists discovered_creators_engagement_idx
  on public.discovered_creators(avg_likes_per_video desc) where hidden = false;

create index if not exists discovered_creators_niches_idx
  on public.discovered_creators using gin(niche_tags);

-- Refresh cron pulls the stalest rows first.
create index if not exists discovered_creators_stale_idx
  on public.discovered_creators(last_scraped_at asc nulls first);

drop trigger if exists discovered_creators_set_updated_at on public.discovered_creators;
create trigger discovered_creators_set_updated_at
before update on public.discovered_creators
for each row execute function public.set_updated_at();

alter table public.discovered_creators enable row level security;

-- INTENTIONALLY PUBLIC. This is the only anon-readable table in the schema.
drop policy if exists "Discovered creators: public read" on public.discovered_creators;
create policy "Discovered creators: public read"
  on public.discovered_creators for select
  to anon, authenticated
  using (hidden = false);


-- ---------------------------------------------------------------------
-- Sample videos, for card thumbnails only. Not a metrics time series —
-- there is deliberately no snapshots table here (cf. 0036), because we
-- do not track these accounts over time.
-- ---------------------------------------------------------------------

create table if not exists public.discovered_creator_videos (
  id uuid primary key default gen_random_uuid(),
  discovered_creator_id uuid not null
    references public.discovered_creators(id) on delete cascade,
  platform_video_id text not null,
  video_url text,
  thumbnail_url text,                 -- signed + expiring, like avatar_url
  description text,
  views integer not null default 0,
  likes integer not null default 0,
  posted_at timestamptz,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (discovered_creator_id, platform_video_id)
);

create index if not exists discovered_creator_videos_creator_idx
  on public.discovered_creator_videos(discovered_creator_id, position asc);

alter table public.discovered_creator_videos enable row level security;

drop policy if exists "Discovered creator videos: public read"
  on public.discovered_creator_videos;
create policy "Discovered creator videos: public read"
  on public.discovered_creator_videos for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.discovered_creators dc
      where dc.id = discovered_creator_videos.discovered_creator_id
        and dc.hidden = false
    )
  );


-- ---------------------------------------------------------------------
-- Keyword rotation for the seed cron. Also our running record of the real
-- videos-per-creator ratio, which is what the Apify bill scales with.
--
-- RLS on with NO policies: service-role only, invisible to the public page.
-- ---------------------------------------------------------------------

create table if not exists public.discovery_searches (
  id uuid primary key default gen_random_uuid(),
  keyword text not null unique,
  niche_tags text[] not null default '{}', -- applied to creators this finds
  last_run_at timestamptz,
  result_count integer not null default 0,  -- billed video results
  creator_count integer not null default 0, -- unique creators kept
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists discovery_searches_rotation_idx
  on public.discovery_searches(last_run_at asc nulls first);

drop trigger if exists discovery_searches_set_updated_at on public.discovery_searches;
create trigger discovery_searches_set_updated_at
before update on public.discovery_searches
for each row execute function public.set_updated_at();

alter table public.discovery_searches enable row level security;


-- ---------------------------------------------------------------------
-- Opt-outs. Kept in their own table rather than relying on the `hidden`
-- flag alone so that a removal survives the creator's row being deleted,
-- and so the seed cron can refuse to re-list someone who opted out before
-- we ever scraped them.
--
-- RLS on with NO policies. The public opt-out form posts to a route
-- handler that writes with the service-role client, so this table never
-- needs to be anon-writable.
-- ---------------------------------------------------------------------

create table if not exists public.discovery_optouts (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'tiktok',
  username text not null,
  reason text,
  created_at timestamptz not null default now(),
  unique (platform, username)
);

alter table public.discovery_optouts enable row level security;


notify pgrst, 'reload schema';
