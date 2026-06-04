-- Add creator portfolio videos and social account verification
-- Run this in the Supabase SQL editor

-- Step 1: Add social account verification fields to creator_profiles
alter table public.creator_profiles 
add column if not exists instagram_verified boolean not null default false,
add column if not exists tiktok_verified boolean not null default false,
add column if not exists youtube_verified boolean not null default false;

-- Step 2: Create table for creator portfolio videos
create table if not exists public.creator_portfolio_videos (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles(user_id) on delete cascade,
  platform text not null check (platform in ('instagram', 'tiktok', 'youtube')),
  video_url text not null,
  thumbnail_url text,
  title text,
  views integer not null default 0 check (views >= 0),
  likes integer not null default 0 check (likes >= 0),
  comments integer not null default 0 check (comments >= 0),
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Step 3: Enable RLS immediately after table creation
alter table public.creator_portfolio_videos enable row level security;

-- Step 4: Add indexes for performance
create index if not exists creator_portfolio_videos_creator_id_idx 
  on public.creator_portfolio_videos(creator_id);
create index if not exists creator_portfolio_videos_platform_idx 
  on public.creator_portfolio_videos(platform);

-- Step 5: Add updated_at trigger for portfolio videos
drop trigger if exists creator_portfolio_videos_set_updated_at on public.creator_portfolio_videos;
create trigger creator_portfolio_videos_set_updated_at
before update on public.creator_portfolio_videos
for each row execute function public.set_updated_at();

-- Step 6: RLS policies for portfolio videos
-- Creators can manage their own portfolio videos
drop policy if exists "Creator portfolio videos: manage own" on public.creator_portfolio_videos;
create policy "Creator portfolio videos: manage own"
  on public.creator_portfolio_videos for all
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

-- Brands can read portfolio videos of onboarded creators
drop policy if exists "Creator portfolio videos: brands read" on public.creator_portfolio_videos;
create policy "Creator portfolio videos: brands read"
  on public.creator_portfolio_videos for select
  to authenticated
  using (
    exists (
      select 1 from public.creator_profiles cp 
      where cp.user_id = creator_id 
      and cp.onboarded_at is not null
    )
  );
