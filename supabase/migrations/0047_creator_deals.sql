-- =====================================================================
-- Creator deals: base pay + CPM + revenue share, paid automatically.
--
-- Every way a creator can earn writes rows into one ledger,
-- `creator_earnings`:
--   * base     — a flat fee when a video is approved
--   * cpm      — daily view growth on approved videos
--   * revshare — a % of each subscription payment from app users who
--                entered the creator's code (via RevenueCat webhooks)
--
-- A weekly job (/api/payouts/run) totals the payable rows per brand,
-- charges the brand's saved card off-session and transfers each
-- creator's share to their Connect account. Refunds and clawbacks are
-- negative ledger rows; money that has already moved is never edited.
--
-- Adds:
--   * pay-term columns on `programs`
--   * review columns on `program_videos`, bigint view counts
--   * `creator_codes`        — one code per (brand, creator)
--   * `creator_earnings`     — the ledger
--   * `payout_batches`       — one charge per brand per payout run
--   * `brand_integrations`   — RevenueCat webhook config per brand
--   * `revenue_attributions` — app user -> creator, locked on first purchase
--   * `revenue_events`       — raw webhook events, idempotency + audit
-- =====================================================================


-- ---------------------------------------------------------------------
-- Pay terms on programs. Any combination may be enabled; a 0/null
-- value turns that pay type off. pay_per_video_cents (0034) stays the
-- base pay, capped at videos_per_period per period.
-- ---------------------------------------------------------------------

alter table public.programs
  add column if not exists cpm_cents integer not null default 0,
  add column if not exists max_payout_per_video_cents integer,
  add column if not exists view_window_days integer not null default 30,
  add column if not exists revshare_bps integer not null default 0,
  add column if not exists revshare_months integer default 12,
  add column if not exists monthly_cap_cents integer,
  add column if not exists ledger_started_at timestamptz not null default now();
  -- revshare_months null = the creator earns for the subscriber's lifetime
  -- monthly_cap_cents null = no cap on what the campaign accrues per month
  -- ledger_started_at: only videos posted on/after this earn through the
  --   ledger. Existing campaigns get the migration time, so videos already
  --   paid through program_payouts can never be paid a second time.

alter table public.programs
  drop constraint if exists programs_pay_terms_check;
alter table public.programs
  add constraint programs_pay_terms_check
  check (
    pay_per_video_cents >= 0
    and cpm_cents >= 0
    and revshare_bps between 0 and 10000
    and view_window_days between 1 and 365
  );

-- A campaign used to require base pay; CPM-only or revshare-only campaigns
-- are now valid, so pay_per_video_cents may be 0.


-- ---------------------------------------------------------------------
-- Video review. Base pay and CPM only accrue on videos the brand has
-- approved; every video a creator posts is synced, so nothing is
-- approved automatically.
-- ---------------------------------------------------------------------

alter table public.program_videos
  add column if not exists review_status text not null default 'pending',
  add column if not exists reviewed_at timestamptz,
  add column if not exists flagged_reason text;

alter table public.program_videos
  drop constraint if exists program_videos_review_status_check;
alter table public.program_videos
  add constraint program_videos_review_status_check
  check (review_status in ('pending', 'approved', 'rejected', 'flagged'));

-- Review changes go through /api/programs/videos/review (service role),
-- not a client-side update policy, so brands can't touch metric columns.

-- Views go past 2^31 on viral videos; CPM math needs the real number.
alter table public.program_videos alter column views type bigint;
alter table public.program_video_metric_snapshots alter column views type bigint;
alter table public.tracked_account_videos alter column views type bigint;
alter table public.tracked_account_video_snapshots alter column views type bigint;


-- ---------------------------------------------------------------------
-- Creator codes: what a creator tells viewers to type into the brand's
-- app ("use code JUSTIN"). One code per creator per brand, shared by all
-- of that brand's campaigns.
-- ---------------------------------------------------------------------

create table if not exists public.creator_codes (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references auth.users(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  created_at timestamptz not null default now(),
  unique (brand_id, code),
  unique (brand_id, creator_id),
  constraint creator_codes_code_format check (code ~ '^[A-Z0-9_]{3,20}$')
);

alter table public.creator_codes enable row level security;

drop policy if exists "Creator codes: brand read own" on public.creator_codes;
create policy "Creator codes: brand read own"
  on public.creator_codes for select
  using (auth.uid() = brand_id);

drop policy if exists "Creator codes: creator read own" on public.creator_codes;
create policy "Creator codes: creator read own"
  on public.creator_codes for select
  using (auth.uid() = creator_id);


-- ---------------------------------------------------------------------
-- Payout batches: one off-session charge per brand per payout run.
-- ---------------------------------------------------------------------

create table if not exists public.payout_batches (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references auth.users(id) on delete cascade,
  earnings_cents integer not null,       -- sum of creator earnings in batch
  platform_fee_cents integer not null,   -- our cut, kept on the platform
  processing_fee_cents integer not null, -- Stripe fee, passed to the brand
  charge_cents integer not null,         -- what the brand's card is charged
  currency text not null default 'usd',
  status text not null default 'charging',
    -- charging | paid | failed | requires_action
  stripe_payment_intent_id text,
  stripe_charge_id text,
  attempts integer not null default 1,
  last_error text,
  next_retry_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payout_batches_status_check
    check (status in ('charging', 'paid', 'failed', 'requires_action'))
);

create index if not exists payout_batches_brand_idx
  on public.payout_batches(brand_id, created_at desc);

drop trigger if exists payout_batches_set_updated_at on public.payout_batches;
create trigger payout_batches_set_updated_at
before update on public.payout_batches
for each row execute function public.set_updated_at();

alter table public.payout_batches enable row level security;

drop policy if exists "Payout batches: brand read own" on public.payout_batches;
create policy "Payout batches: brand read own"
  on public.payout_batches for select
  using (auth.uid() = brand_id);


-- ---------------------------------------------------------------------
-- The ledger. Written only by server code (service role).
--
--   held     — earned, waiting out its hold (fraud/refund window)
--   payable  — will be included in the next payout run
--   paid     — transferred to the creator (stripe_transfer_id set)
--   reversed — cancelled before it was paid (rejected video, refund)
--
-- source_key is the idempotency key: re-running a cron or re-delivering
-- a webhook can never create the same earning twice.
-- ---------------------------------------------------------------------

create table if not exists public.creator_earnings (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references auth.users(id) on delete cascade,
  program_id uuid references public.programs(id) on delete set null,
  program_member_id uuid references public.program_members(id) on delete set null,
  creator_id uuid not null references auth.users(id) on delete cascade,
  program_video_id uuid references public.program_videos(id) on delete set null,
  kind text not null, -- base | cpm | revshare | adjustment
  amount_cents integer not null,
  source_key text not null unique,
  status text not null default 'held',
  available_at timestamptz not null default now(),
  payout_batch_id uuid references public.payout_batches(id) on delete set null,
  stripe_transfer_id text,
  paid_at timestamptz,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint creator_earnings_kind_check
    check (kind in ('base', 'cpm', 'revshare', 'adjustment')),
  constraint creator_earnings_status_check
    check (status in ('held', 'payable', 'paid', 'reversed'))
);

create index if not exists creator_earnings_brand_status_idx
  on public.creator_earnings(brand_id, status, available_at);
create index if not exists creator_earnings_creator_idx
  on public.creator_earnings(creator_id, created_at desc);
create index if not exists creator_earnings_video_idx
  on public.creator_earnings(program_video_id, kind);
create index if not exists creator_earnings_batch_idx
  on public.creator_earnings(payout_batch_id);

drop trigger if exists creator_earnings_set_updated_at on public.creator_earnings;
create trigger creator_earnings_set_updated_at
before update on public.creator_earnings
for each row execute function public.set_updated_at();

alter table public.creator_earnings enable row level security;

drop policy if exists "Creator earnings: brand read own" on public.creator_earnings;
create policy "Creator earnings: brand read own"
  on public.creator_earnings for select
  using (auth.uid() = brand_id);

drop policy if exists "Creator earnings: creator read own" on public.creator_earnings;
create policy "Creator earnings: creator read own"
  on public.creator_earnings for select
  using (auth.uid() = creator_id);


-- ---------------------------------------------------------------------
-- Brand integrations: RevenueCat for now. The brand pastes our webhook
-- URL (keyed by id) and webhook_secret into RevenueCat as the
-- Authorization header value. The secret is never returned to other
-- users; the brand reads it to copy it.
-- ---------------------------------------------------------------------

create table if not exists public.brand_integrations (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'revenuecat',
  webhook_secret text not null,
  status text not null default 'pending', -- pending | connected
  store_takehome_rate numeric(4,3) not null default 0.85,
    -- share of the store price the brand keeps after Apple/Google's cut;
    -- 0.85 under the small-business programs. Used when the event has no
    -- takehome_percentage of its own.
  last_event_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, provider)
);

drop trigger if exists brand_integrations_set_updated_at on public.brand_integrations;
create trigger brand_integrations_set_updated_at
before update on public.brand_integrations
for each row execute function public.set_updated_at();

alter table public.brand_integrations enable row level security;

drop policy if exists "Brand integrations: brand read own" on public.brand_integrations;
create policy "Brand integrations: brand read own"
  on public.brand_integrations for select
  using (auth.uid() = brand_id);

drop policy if exists "Brand integrations: brand update own" on public.brand_integrations;
create policy "Brand integrations: brand update own"
  on public.brand_integrations for update
  using (auth.uid() = brand_id)
  with check (auth.uid() = brand_id);


-- ---------------------------------------------------------------------
-- Revenue attribution: which creator brought in which app user. The
-- first code seen for a user wins and is locked once they purchase, so a
-- second creator can't take over an existing subscriber.
-- ---------------------------------------------------------------------

create table if not exists public.revenue_attributions (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references auth.users(id) on delete cascade,
  app_user_id text not null,
  creator_id uuid not null references auth.users(id) on delete cascade,
  program_id uuid references public.programs(id) on delete set null,
  program_member_id uuid references public.program_members(id) on delete set null,
  creator_code text not null,
  first_purchase_at timestamptz,
  expires_at timestamptz, -- first_purchase_at + revshare_months; null = never
  created_at timestamptz not null default now(),
  unique (brand_id, app_user_id)
);

create index if not exists revenue_attributions_creator_idx
  on public.revenue_attributions(creator_id);

alter table public.revenue_attributions enable row level security;

drop policy if exists "Revenue attributions: brand read own" on public.revenue_attributions;
create policy "Revenue attributions: brand read own"
  on public.revenue_attributions for select
  using (auth.uid() = brand_id);


-- ---------------------------------------------------------------------
-- Raw revenue events. Unique on (provider, event_id) so redelivery is a
-- no-op. Server-only; no policies.
-- ---------------------------------------------------------------------

create table if not exists public.revenue_events (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'revenuecat',
  event_id text not null,
  event_type text not null,
  environment text,
  app_user_id text,
  transaction_id text,
  payload jsonb not null,
  processed_at timestamptz,
  error text,
  received_at timestamptz not null default now(),
  unique (provider, event_id)
);

create index if not exists revenue_events_brand_idx
  on public.revenue_events(brand_id, received_at desc);

alter table public.revenue_events enable row level security;

notify pgrst, 'reload schema';
