-- =====================================================================
-- The brand's main page: ticking off the week, and the creator columns
-- (To message → Messaged → Said yes → Posting).
--
-- brand_outreach holds creators from a paid plan, including scraped
-- accounts, so like brand_plans it has RLS on with NO policies: only
-- app/api/board and app/join touch it, and they check who is asking.
-- =====================================================================

alter table public.brand_plans
  add column if not exists done_tasks text[] not null default '{}',
  add column if not exists week_started_at timestamptz;

create table if not exists public.brand_outreach (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references auth.users(id) on delete cascade,
  -- platform: creator_ref is the creator's user id
  -- directory: creator_ref is a discovered_creators id
  -- manual: creator_ref is a TikTok handle the brand typed in
  source text not null check (source in ('platform', 'directory', 'manual')),
  creator_ref text not null,
  name text not null,
  handle text not null default '',
  -- 'removed' is kept so the creator isn't added back from the plan.
  status text not null default 'to_message'
    check (status in ('to_message', 'messaged', 'said_yes', 'posting', 'removed')),
  notes text not null default '',
  -- Sent to a creator with no account; whoever uses it first is linked.
  invite_token uuid not null default gen_random_uuid() unique,
  joined_creator_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, source, creator_ref)
);

create index if not exists brand_outreach_brand_idx
  on public.brand_outreach(brand_id, created_at);

drop trigger if exists brand_outreach_set_updated_at on public.brand_outreach;
create trigger brand_outreach_set_updated_at
before update on public.brand_outreach
for each row execute function public.set_updated_at();

alter table public.brand_outreach enable row level security;

notify pgrst, 'reload schema';
