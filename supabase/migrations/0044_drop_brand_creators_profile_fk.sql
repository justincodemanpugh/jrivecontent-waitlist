-- =====================================================================
-- Drop the redundant brand_profiles foreign key on brand_creators.
--
-- brand_creators.brand_id carries TWO foreign keys:
--   1. references auth.users(id)               -- 0025, in the table definition
--   2. brand_creators_brand_id_fkey_profile    -- 0025, added in a do$$ block
--      -> brand_profiles(user_id)
--
-- (2) was added alongside a batch of constraints whose purpose was to let
-- PostgREST resolve embeds. Its sibling on creator_id IS used that way
-- (lib/dashboard/brand/creatorsApi.js embeds creator_profiles through
-- brand_creators_creator_id_fkey_profile), but NOTHING in the app ever embeds
-- brand_profiles through brand_creators.
--
-- So (2) bought no query capability while making "Connect with creator" fail
-- outright — with a raw Postgres string in an alert — for any authenticated
-- user lacking a brand_profiles row. Browse Creators only just became
-- reachable in the UI, so this path had effectively never run in production.
--
-- Dropping it does NOT weaken access control. Writes here are scoped by RLS,
-- not by this constraint:
--
--   "Brand creators: brand manage own"
--     on public.brand_creators for all
--     using (auth.uid() = brand_id) with check (auth.uid() = brand_id);
--
-- so a user can only ever write roster rows for themselves. Referential
-- integrity on brand_id is still enforced by FK (1) against auth.users.
-- =====================================================================

do $$
begin
  if exists (
    select 1 from pg_constraint
     where conname = 'brand_creators_brand_id_fkey_profile'
       and conrelid = 'public.brand_creators'::regclass
  ) then
    alter table public.brand_creators
      drop constraint brand_creators_brand_id_fkey_profile;
  end if;
end$$;

-- brand_creators_creator_id_fkey_profile is deliberately LEFT IN PLACE — it
-- backs the creator_profiles embed the roster query depends on.

notify pgrst, 'reload schema';
