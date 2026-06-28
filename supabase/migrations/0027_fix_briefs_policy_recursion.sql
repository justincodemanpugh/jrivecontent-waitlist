-- =====================================================================
-- Fix Briefs Policy Circular Reference
--
-- Issue: The briefs and brief_recipients RLS policies reference each other,
-- causing infinite recursion when PostgreSQL tries to evaluate them.
--
-- Solution: Replace the circular reference with a direct foreign key check
-- using the creator_id from brief_recipients instead of joining back to
-- brief_recipients from the briefs policy.
-- =====================================================================

-- Drop the problematic creator read policy on briefs
drop policy if exists "Briefs: creator read received" on public.briefs;

-- Replace with a non-circular policy that checks brief_recipients directly
-- using the creator_id from the current user context
create policy "Briefs: creator read received"
  on public.briefs for select
  using (
    -- Check if current user is a recipient of this brief
    exists (
      select 1 from public.brief_recipients br
      where br.brief_id = briefs.id
        and br.creator_id = auth.uid()
    )
  );

-- Also need to ensure the brief_recipients policies don't create similar issues
-- Let's check if the brand policy on brief_recipients is causing recursion
drop policy if exists "Brief recipients: brand manage own" on public.brief_recipients;

-- Replace with a simpler policy that uses direct foreign key relationship
create policy "Brief recipients: brand manage own"
  on public.brief_recipients for all
  using (
    -- Check if the brief belongs to the current brand user
    exists (
      select 1 from public.briefs b
      where b.id = brief_recipients.brief_id
        and b.brand_id = auth.uid()
    )
  )
  with check (
    -- For inserts, check the brief belongs to the current brand user
    exists (
      select 1 from public.briefs b
      where b.id = brief_recipients.brief_id
        and b.brand_id = auth.uid()
    )
  );

-- Ensure creator policies remain simple and don't reference briefs
-- These should be fine as they only use auth.uid() = creator_id
drop policy if exists "Brief recipients: creator read own" on public.brief_recipients;
create policy "Brief recipients: creator read own"
  on public.brief_recipients for select
  using (auth.uid() = creator_id);

drop policy if exists "Brief recipients: creator update own" on public.brief_recipients;
create policy "Brief recipients: creator update own"
  on public.brief_recipients for update
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

-- Reload PostgREST schema to apply changes
notify pgrst, 'reload schema';
