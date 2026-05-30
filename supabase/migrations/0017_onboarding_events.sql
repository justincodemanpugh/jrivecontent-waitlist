-- =====================================================================
-- Onboarding funnel events.
--
-- One row per step interaction during the brand/creator onboarding flow.
-- The client emits events via the logOnboardingEvent server action
-- (lib/onboarding/analytics.js); the /admin/onboarding page aggregates
-- these into a per-step drop-off funnel.
--
-- Event vocabulary (kept as text so we can add new kinds without a
-- migration):
--   onboarding_started   -- user landed on step 0 for the first time
--   step_viewed          -- a step (re)entered the viewport
--   step_completed       -- user clicked Continue and the save succeeded
--   step_skipped         -- user clicked Skip on an optional step
--   onboarding_completed -- final completeOnboarding succeeded
-- =====================================================================

create table if not exists public.onboarding_events (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('brand', 'creator')),
  event text not null,
  step_index int,
  step_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists onboarding_events_user_created_idx
  on public.onboarding_events (user_id, created_at desc);

create index if not exists onboarding_events_role_event_idx
  on public.onboarding_events (role, event, created_at desc);

create index if not exists onboarding_events_funnel_idx
  on public.onboarding_events (role, step_index, event, user_id);

alter table public.onboarding_events enable row level security;

-- Users may insert their own events. No select/update/delete from the
-- client — the admin funnel reads via the service-role key.
drop policy if exists "OnboardingEvents: self insert" on public.onboarding_events;
create policy "OnboardingEvents: self insert"
  on public.onboarding_events for insert
  with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
