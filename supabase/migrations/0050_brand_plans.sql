-- =====================================================================
-- Saved creator plans (/plan): what a founder got from the onboarding, kept
-- so it is the same plan after signing up and paying.
--
-- RLS on with NO policies, so only server code (service role) can touch the
-- table. That is deliberate: `plan` holds the full plan, including what the
-- free preview withholds. A "read your own row" policy would hand all of it
-- to anyone with a free account. app/api/plan checks ownership and the
-- subscription before returning anything.
-- =====================================================================

create table if not exists public.brand_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  app_url text not null,
  app_name text not null,
  icon_url text,
  niche text not null,
  answers jsonb not null,
  plan jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, app_url)
);

create index if not exists brand_plans_latest_idx
  on public.brand_plans(user_id, updated_at desc);

drop trigger if exists brand_plans_set_updated_at on public.brand_plans;
create trigger brand_plans_set_updated_at
before update on public.brand_plans
for each row execute function public.set_updated_at();

alter table public.brand_plans enable row level security;

notify pgrst, 'reload schema';
