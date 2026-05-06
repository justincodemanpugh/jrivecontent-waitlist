-- Brand onboarding profile.
-- Run this in the Supabase SQL editor (or `supabase db push`) before testing.

create table if not exists public.brand_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  brand_name text,
  website text,
  industry text,
  brand_stage text,
  monthly_budget text,
  content_needs text[] not null default '{}',
  referral_source text,
  terms_accepted_at timestamptz,
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at fresh.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists brand_profiles_set_updated_at on public.brand_profiles;
create trigger brand_profiles_set_updated_at
before update on public.brand_profiles
for each row execute function public.set_updated_at();

-- RLS: each user can only see/edit their own brand profile.
alter table public.brand_profiles enable row level security;

drop policy if exists "Brand profiles: select own" on public.brand_profiles;
create policy "Brand profiles: select own"
  on public.brand_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Brand profiles: insert own" on public.brand_profiles;
create policy "Brand profiles: insert own"
  on public.brand_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Brand profiles: update own" on public.brand_profiles;
create policy "Brand profiles: update own"
  on public.brand_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- =====================================================================
-- Creator onboarding profile.
-- =====================================================================

create table if not exists public.creator_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  handle text unique,
  bio text,
  avatar_url text,
  niches text[] not null default '{}',
  content_types text[] not null default '{}',
  rate_min integer,
  rate_max integer,
  portfolio_url text,
  instagram_handle text,
  tiktok_handle text,
  youtube_handle text,
  location text,
  terms_accepted_at timestamptz,
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists creator_profiles_set_updated_at on public.creator_profiles;
create trigger creator_profiles_set_updated_at
before update on public.creator_profiles
for each row execute function public.set_updated_at();

-- RLS: creators can only see/edit their own row. Brands can read public-ish
-- fields of any onboarded creator (handled via a view or relaxed policy as
-- the marketplace grows; for now, lock down to self).
alter table public.creator_profiles enable row level security;

drop policy if exists "Creator profiles: select own" on public.creator_profiles;
create policy "Creator profiles: select own"
  on public.creator_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Creator profiles: insert own" on public.creator_profiles;
create policy "Creator profiles: insert own"
  on public.creator_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Creator profiles: update own" on public.creator_profiles;
create policy "Creator profiles: update own"
  on public.creator_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
