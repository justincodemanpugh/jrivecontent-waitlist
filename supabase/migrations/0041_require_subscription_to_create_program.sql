-- =====================================================================
-- Require an active subscription (or trial) to create a campaign.
--
-- Campaigns are created by a direct client-side insert into `programs`
-- (lib/dashboard/brand/programsApi.js createProgram), so a JavaScript
-- check alone is bypassable by anyone calling PostgREST directly. The
-- gate therefore lives here, in RLS.
--
-- The existing "Programs: brand manage own" policy is `for all`, which
-- would gate UPDATE and DELETE too. That's wrong: a brand whose
-- subscription lapses must still be able to read, pause and archive the
-- campaigns they already have — we only want to stop them creating NEW
-- ones. So it's split into an ownership policy for select/update/delete
-- plus a separate insert policy carrying the subscription requirement.
-- =====================================================================

-- SECURITY DEFINER so reading brand_profiles from inside a policy doesn't
-- re-trigger that table's own RLS — same pattern as
-- public.is_program_owner in 0035_fix_program_rls_recursion.sql.
--
-- The status list mirrors PAID_STATUSES in lib/dashboard/brand/gigsApi.js.
-- 'past_due' counts as paid so a failed renewal doesn't instantly lock a
-- brand out mid-billing-cycle; Stripe moves it to 'canceled' on dunning
-- exhaustion, which does revoke access.
create or replace function public.brand_has_active_subscription(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.brand_profiles
    where user_id = p_user_id
      and subscription_status in ('active', 'trialing', 'past_due')
  );
$$;

-- Note: "Programs: creator read enrolled" (0034) is deliberately left in
-- place — creators must still be able to read campaigns they're enrolled in.
drop policy if exists "Programs: brand manage own" on public.programs;

drop policy if exists "Programs: brand read own" on public.programs;
create policy "Programs: brand read own"
  on public.programs for select
  using (auth.uid() = brand_id);

drop policy if exists "Programs: brand update own" on public.programs;
create policy "Programs: brand update own"
  on public.programs for update
  using (auth.uid() = brand_id)
  with check (auth.uid() = brand_id);

drop policy if exists "Programs: brand delete own" on public.programs;
create policy "Programs: brand delete own"
  on public.programs for delete
  using (auth.uid() = brand_id);

-- The gate.
drop policy if exists "Programs: brand create own with subscription" on public.programs;
create policy "Programs: brand create own with subscription"
  on public.programs for insert
  with check (
    auth.uid() = brand_id
    and public.brand_has_active_subscription(auth.uid())
  );

notify pgrst, 'reload schema';
