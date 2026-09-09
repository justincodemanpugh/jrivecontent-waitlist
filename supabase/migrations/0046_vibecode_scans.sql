-- =====================================================================
-- Cache + rate-limit ledger for the public "scan your app" tool on
-- /vibecode (app/api/vibecode/scan/route.js).
--
-- One row per app URL anyone has ever scanned. The row does three jobs:
--
--   1. Cache. A fresh scan costs one Anthropic call, so a URL scanned in
--      the last VIBECODE_CACHE_DAYS is replayed from `result` for free.
--      This matters more than it looks: the whole point of the page is
--      that people share their results, and a shared link re-scans the
--      same URL.
--   2. Rate limit. `scanned_by_ip_hash` + `scanned_at` are counted per
--      caller to cap how much LLM spend one visitor can trigger. Only
--      *fresh* scans bump `scanned_at`, so replaying the cache is free
--      and uncounted, which is the behaviour we want.
--   3. Kill switch. The same `scanned_at` index backs a global
--      scans-per-day ceiling.
--
-- `scanned_at` is therefore "when we last paid for this row", not
-- "when the row appeared" — `created_at` is that. Do not collapse them.
--
-- RLS on with NO policies: the route reads and writes with the
-- service-role client, and nothing here is ever exposed to the browser
-- directly (the route decides what half of `result` a caller may see).
-- =====================================================================

create table if not exists public.vibecode_scans (
  id uuid primary key default gen_random_uuid(),
  -- Scheme+host+path, lowercased, query and fragment stripped. See
  -- normalizeAppUrl() in lib/vibecode/appScan.js — the two must agree or
  -- the cache silently never hits.
  normalized_url text not null unique,
  source text not null,                   -- 'ios' | 'web'
  app_name text,
  app_category text,
  -- Full payload: { app, plan, creators, coverage }. The route serves a
  -- redacted subset of this to callers without an active subscription.
  result jsonb not null,
  scanned_by_ip_hash text,                -- salted hash, never a raw IP
  scanned_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Global kill switch (scans in the last 24h).
create index if not exists vibecode_scans_scanned_at_idx
  on public.vibecode_scans(scanned_at desc);

-- Per-caller rate limit.
create index if not exists vibecode_scans_ip_idx
  on public.vibecode_scans(scanned_by_ip_hash, scanned_at desc);

alter table public.vibecode_scans enable row level security;


notify pgrst, 'reload schema';
