-- =====================================================================
-- Activate Brand→Creator Roster Connections
--
-- Briefs can only be sent to creators whose brand_creators connection is
-- 'active' (see NewBriefForm + dashboard stats). However, connections were
-- created with status 'pending' and nothing in the product ever flips them
-- to 'active' — there is no creator-side acceptance flow for brand_creators
-- (that flow only exists for gig_invitations).
--
-- A brand's roster is private and self-managed: a creator the brand adds is
-- theirs to brief immediately. So connections should be 'active' on creation.
--
-- This migration:
--   * Sets the default status to 'active' for new rows.
--   * Backfills existing 'pending' rows to 'active' so previously added
--     creators become briefable.
-- =====================================================================

alter table public.brand_creators
  alter column status set default 'active';

update public.brand_creators
   set status = 'active',
       updated_at = now()
 where status = 'pending';

notify pgrst, 'reload schema';
