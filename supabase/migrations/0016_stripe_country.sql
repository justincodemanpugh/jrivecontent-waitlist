-- 0016_stripe_country.sql
-- Adds a `country` column to brand_profiles and creator_profiles so the
-- Stripe Connect account creation API can pass it dynamically. Without
-- this, stripe.accounts.create() falls back to the platform's default
-- country (currently locking new Express accounts to CA/US for everyone).
--
-- Stored as a 2-letter ISO 3166-1 alpha-2 code (e.g. "US", "CA", "GB").
-- Nullable so existing rows stay valid; the API routes refuse to create
-- a Stripe account until this is populated.

alter table public.brand_profiles
  add column if not exists country text;

alter table public.creator_profiles
  add column if not exists country text;

-- Enforce ISO alpha-2 format when present.
alter table public.brand_profiles
  drop constraint if exists brand_profiles_country_format;
alter table public.brand_profiles
  add constraint brand_profiles_country_format
  check (country is null or country ~ '^[A-Z]{2}$');

alter table public.creator_profiles
  drop constraint if exists creator_profiles_country_format;
alter table public.creator_profiles
  add constraint creator_profiles_country_format
  check (country is null or country ~ '^[A-Z]{2}$');
