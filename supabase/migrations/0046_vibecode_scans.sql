-- =====================================================================
-- Scan log for the public "scan your app" tool on /vibecode
-- (app/api/vibecode/scan/route.js).
--
-- One row per app URL anyone has ever pasted in. The row does three jobs,
-- and notably NOT a fourth:
--
--   1. Demand signal. This is a free list of every app someone cared
--      enough to paste — what people are building, which categories
--      recur, and a warm list worth reaching out to.
--   2. Rate limit. `scanned_by_ip_hash` + `scanned_at` cap how often one
--      caller can make the server fetch a URL of their choosing. The
--      scan itself costs nothing, so this is abuse protection (don't be
--      an open proxy), not spend protection.
--   3. Metadata cache. Re-scanning the same link skips the store lookup
--      or page fetch.
--
-- It does NOT cache results. Creator and video matches are re-queried on
-- every scan: it is one indexed query, results improve as the discovery
-- cron widens the directory, and the niche override on the results page
-- would otherwise need its own cache key.
--
-- `scanned_at` is "when we last fetched this app's metadata", not "when
-- the row appeared" — `created_at` is that. Do not collapse them.
--
-- RLS on with NO policies: the route reads and writes with the
-- service-role client and decides for itself what a caller may see.
-- =====================================================================

create table if not exists public.vibecode_scans (
  id uuid primary key default gen_random_uuid(),
  -- Scheme+host+path, lowercased, query and fragment stripped. See
  -- normalizeAppUrl() in lib/vibecode/appScan.js — the two must agree or
  -- the cache silently never hits.
  normalized_url text not null unique,
  source text not null,                   -- 'ios' | 'web'
  app_name text,
  app_category text,                      -- Apple primaryGenreName, null for web
  scanned_by_ip_hash text,                -- salted hash, never a raw IP
  scanned_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Per-caller rate limit.
create index if not exists vibecode_scans_ip_idx
  on public.vibecode_scans(scanned_by_ip_hash, scanned_at desc);

-- Reading the log newest-first.
create index if not exists vibecode_scans_scanned_at_idx
  on public.vibecode_scans(scanned_at desc);

alter table public.vibecode_scans enable row level security;


notify pgrst, 'reload schema';
