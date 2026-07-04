-- =====================================================================
-- Creator Programs: Ongoing TikTok performance-tracking programs.
--
-- Unlike briefs (one-off, per-video), a Program is a recurring
-- arrangement: "post N videos every week/month, get paid $X per video on
-- a weekly/biweekly/monthly cycle." Creators connect their TikTok account
-- via OAuth; a scheduled sync job discovers their posted videos and
-- refreshes view/like/comment/share counts automatically.
--
-- Adds:
--   * `creator_social_accounts` — TikTok OAuth tokens per creator.
--   * `programs` — brand-defined ongoing program.
--   * `program_members` — creator's enrollment in a program.
--   * `program_videos` — a TikTok video linked to a program membership.
--   * `program_video_metric_snapshots` — time series of view/like/comment counts.
--   * `program_payouts` — recurring payout periods (escrow via Stripe Connect).
-- =====================================================================


-- ---------------------------------------------------------------------
-- Creator Social Accounts: OAuth tokens for TikTok (per creator).
-- Tokens are only ever read/written by server routes using the admin
-- client — no client-side insert/update policy is defined.
-- ---------------------------------------------------------------------

create table if not exists public.creator_social_accounts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  platform text not null default 'tiktok', -- tiktok (more platforms later)
  platform_user_id text not null, -- TikTok open_id
  username text,
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  scope text,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (creator_id, platform)
);

create index if not exists creator_social_accounts_creator_idx
  on public.creator_social_accounts(creator_id);

drop trigger if exists creator_social_accounts_set_updated_at on public.creator_social_accounts;
create trigger creator_social_accounts_set_updated_at
before update on public.creator_social_accounts
for each row execute function public.set_updated_at();

alter table public.creator_social_accounts enable row level security;

-- Creator can read (to show "Connected as @handle") and delete (disconnect)
-- their own row. All writes/updates of tokens happen server-side via the
-- service role, bypassing RLS.
drop policy if exists "Creator social accounts: creator read own" on public.creator_social_accounts;
create policy "Creator social accounts: creator read own"
  on public.creator_social_accounts for select
  using (auth.uid() = creator_id);

drop policy if exists "Creator social accounts: creator delete own" on public.creator_social_accounts;
create policy "Creator social accounts: creator delete own"
  on public.creator_social_accounts for delete
  using (auth.uid() = creator_id);


-- ---------------------------------------------------------------------
-- Programs: Brand-defined ongoing creator program.
-- ---------------------------------------------------------------------

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  platform text not null default 'tiktok',
  videos_per_period integer not null default 1,
  period_type text not null default 'month', -- week | month
  pay_per_video_cents integer not null default 0,
  payout_schedule text not null default 'monthly', -- weekly | biweekly | monthly
  status text not null default 'active', -- active | paused | archived
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists programs_brand_idx
  on public.programs(brand_id, created_at desc);

drop trigger if exists programs_set_updated_at on public.programs;
create trigger programs_set_updated_at
before update on public.programs
for each row execute function public.set_updated_at();

alter table public.programs enable row level security;

drop policy if exists "Programs: brand manage own" on public.programs;
create policy "Programs: brand manage own"
  on public.programs for all
  using (auth.uid() = brand_id)
  with check (auth.uid() = brand_id);


-- ---------------------------------------------------------------------
-- Program Members: Creator's enrollment in a program.
-- ---------------------------------------------------------------------

create table if not exists public.program_members (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'invited', -- invited | active | paused | removed
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (program_id, creator_id)
);

create index if not exists program_members_program_idx
  on public.program_members(program_id);
create index if not exists program_members_creator_idx
  on public.program_members(creator_id, status);

drop trigger if exists program_members_set_updated_at on public.program_members;
create trigger program_members_set_updated_at
before update on public.program_members
for each row execute function public.set_updated_at();

alter table public.program_members enable row level security;

-- Brand can manage members of their own programs.
drop policy if exists "Program members: brand manage own" on public.program_members;
create policy "Program members: brand manage own"
  on public.program_members for all
  using (
    exists (
      select 1 from public.programs p
      where p.id = program_members.program_id
        and p.brand_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.programs p
      where p.id = program_members.program_id
        and p.brand_id = auth.uid()
    )
  );

-- Creator can read and update (accept/decline/pause) their own membership.
drop policy if exists "Program members: creator read own" on public.program_members;
create policy "Program members: creator read own"
  on public.program_members for select
  using (auth.uid() = creator_id);

drop policy if exists "Program members: creator update own" on public.program_members;
create policy "Program members: creator update own"
  on public.program_members for update
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

-- Creators can read programs they're a member of.
drop policy if exists "Programs: creator read enrolled" on public.programs;
create policy "Programs: creator read enrolled"
  on public.programs for select
  using (
    exists (
      select 1 from public.program_members pm
      where pm.program_id = programs.id
        and pm.creator_id = auth.uid()
    )
  );


-- ---------------------------------------------------------------------
-- Program Videos: A TikTok video linked to a program membership.
-- Rows are inserted/updated by the tiktok-sync cron job using the admin
-- client (service role), which bypasses RLS — the insert/update policies
-- below exist for direct creator/brand use if ever needed client-side.
-- ---------------------------------------------------------------------

create table if not exists public.program_videos (
  id uuid primary key default gen_random_uuid(),
  program_member_id uuid not null references public.program_members(id) on delete cascade,
  tiktok_video_id text not null,
  video_url text,
  posted_at timestamptz,
  first_synced_at timestamptz not null default now(),
  last_synced_at timestamptz not null default now(),
  views integer not null default 0,
  likes integer not null default 0,
  comments integer not null default 0,
  shares integer not null default 0,
  created_at timestamptz not null default now(),
  unique (program_member_id, tiktok_video_id)
);

create index if not exists program_videos_member_idx
  on public.program_videos(program_member_id, posted_at desc);

alter table public.program_videos enable row level security;

-- Creator can read their own videos.
drop policy if exists "Program videos: creator read own" on public.program_videos;
create policy "Program videos: creator read own"
  on public.program_videos for select
  using (
    exists (
      select 1 from public.program_members pm
      where pm.id = program_videos.program_member_id
        and pm.creator_id = auth.uid()
    )
  );

-- Brand can read videos for members of their own programs.
drop policy if exists "Program videos: brand read own" on public.program_videos;
create policy "Program videos: brand read own"
  on public.program_videos for select
  using (
    exists (
      select 1 from public.program_members pm
      join public.programs p on p.id = pm.program_id
      where pm.id = program_videos.program_member_id
        and p.brand_id = auth.uid()
    )
  );


-- ---------------------------------------------------------------------
-- Program Video Metric Snapshots: time series for charts. Insert-only.
-- ---------------------------------------------------------------------

create table if not exists public.program_video_metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  program_video_id uuid not null references public.program_videos(id) on delete cascade,
  views integer not null default 0,
  likes integer not null default 0,
  comments integer not null default 0,
  shares integer not null default 0,
  captured_at timestamptz not null default now()
);

create index if not exists program_video_metric_snapshots_video_idx
  on public.program_video_metric_snapshots(program_video_id, captured_at desc);

alter table public.program_video_metric_snapshots enable row level security;

drop policy if exists "Program video snapshots: creator read own" on public.program_video_metric_snapshots;
create policy "Program video snapshots: creator read own"
  on public.program_video_metric_snapshots for select
  using (
    exists (
      select 1 from public.program_videos pv
      join public.program_members pm on pm.id = pv.program_member_id
      where pv.id = program_video_metric_snapshots.program_video_id
        and pm.creator_id = auth.uid()
    )
  );

drop policy if exists "Program video snapshots: brand read own" on public.program_video_metric_snapshots;
create policy "Program video snapshots: brand read own"
  on public.program_video_metric_snapshots for select
  using (
    exists (
      select 1 from public.program_videos pv
      join public.program_members pm on pm.id = pv.program_member_id
      join public.programs p on p.id = pm.program_id
      where pv.id = program_video_metric_snapshots.program_video_id
        and p.brand_id = auth.uid()
    )
  );


-- ---------------------------------------------------------------------
-- Program Payouts: Recurring payout periods, mirrors brief_payments'
-- escrow status flow (pending -> escrowed -> released) from 0026.
-- ---------------------------------------------------------------------

create table if not exists public.program_payouts (
  id uuid primary key default gen_random_uuid(),
  program_member_id uuid not null references public.program_members(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  brand_id uuid not null references auth.users(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,

  period_start timestamptz not null,
  period_end timestamptz not null,
  video_count integer not null default 0,

  amount_cents integer not null,          -- what the brand pays
  platform_fee_cents integer not null,    -- our cut
  creator_payout_cents integer not null,  -- what the creator receives

  brand_stripe_account_id text,

  status text not null default 'pending',
    -- pending          : period ended, payout not yet started
    -- escrowed         : brand paid; funds in brand's Connect balance
    -- released         : transferred to creator
    -- released_pending : approved but creator hasn't onboarded Stripe yet
    -- refunded         : refunded back to brand
    -- failed           : checkout failed/expired

  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_transfer_id text,

  deposited_at timestamptz,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (program_member_id, period_start, period_end)
);

create index if not exists program_payouts_brand_idx    on public.program_payouts(brand_id);
create index if not exists program_payouts_creator_idx  on public.program_payouts(creator_id);
create index if not exists program_payouts_program_idx  on public.program_payouts(program_id);
create index if not exists program_payouts_status_idx   on public.program_payouts(status);

drop trigger if exists program_payouts_set_updated_at on public.program_payouts;
create trigger program_payouts_set_updated_at
before update on public.program_payouts
for each row execute function public.set_updated_at();

alter table public.program_payouts enable row level security;

drop policy if exists "Program payouts: members read" on public.program_payouts;
create policy "Program payouts: members read"
  on public.program_payouts for select
  using (auth.uid() = brand_id or auth.uid() = creator_id);


-- ---------------------------------------------------------------------
-- Foreign keys for PostgREST embedding (creator_profiles/brand_profiles
-- are keyed on user_id, not auth.users directly — mirrors 0025).
-- ---------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'programs_brand_id_fkey_profile'
       and conrelid = 'public.programs'::regclass
  ) then
    alter table public.programs
      add constraint programs_brand_id_fkey_profile
      foreign key (brand_id)
      references public.brand_profiles(user_id)
      on delete cascade;
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'program_members_creator_id_fkey_profile'
       and conrelid = 'public.program_members'::regclass
  ) then
    alter table public.program_members
      add constraint program_members_creator_id_fkey_profile
      foreign key (creator_id)
      references public.creator_profiles(user_id)
      on delete cascade;
  end if;
end$$;


notify pgrst, 'reload schema';
