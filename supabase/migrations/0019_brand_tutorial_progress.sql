-- =====================================================================
-- Brand tutorial progress tracking.
--
-- Tracks which tutorial steps a brand has completed and whether they've
-- dismissed the tutorial checklist. Used to show/hide the guided tour
-- and checklist on the brand dashboard.
-- =====================================================================

create table if not exists public.brand_tutorial_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  -- Individual step completion flags
  profile_completed boolean not null default false,
  first_gig_posted boolean not null default false,
  browsed_creators boolean not null default false,
  checked_applicants boolean not null default false,
  viewed_upgrade boolean not null default false,
  -- Tour state
  tour_completed boolean not null default false,
  tour_dismissed boolean not null default false,
  checklist_hidden boolean not null default false,
  -- Timestamps
  first_dashboard_visit_at timestamptz,
  tour_started_at timestamptz,
  tour_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists brand_tutorial_progress_updated_idx
  on public.brand_tutorial_progress (updated_at desc);

-- Keep updated_at fresh.
drop trigger if exists brand_tutorial_progress_set_updated_at on public.brand_tutorial_progress;
create trigger brand_tutorial_progress_set_updated_at
before update on public.brand_tutorial_progress
for each row execute function public.set_updated_at();

alter table public.brand_tutorial_progress enable row level security;

-- Users can read and update their own progress.
drop policy if exists "BrandTutorialProgress: self select" on public.brand_tutorial_progress;
create policy "BrandTutorialProgress: self select"
  on public.brand_tutorial_progress for select
  using (auth.uid() = user_id);

drop policy if exists "BrandTutorialProgress: self insert" on public.brand_tutorial_progress;
create policy "BrandTutorialProgress: self insert"
  on public.brand_tutorial_progress for insert
  with check (auth.uid() = user_id);

drop policy if exists "BrandTutorialProgress: self update" on public.brand_tutorial_progress;
create policy "BrandTutorialProgress: self update"
  on public.brand_tutorial_progress for update
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';
