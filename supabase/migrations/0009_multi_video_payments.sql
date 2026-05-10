-- =====================================================================
-- Multi-video escrow support.
--
-- A single conversation can now span multiple videos. The brand picks
-- how many they want when they make the initial deposit, and can later
-- "request more videos" which triggers an additional Stripe checkout
-- that tops up the same payment row.
--
-- On every approved deliverable the API releases ONE video's worth of
-- payout to the creator (creator_payout_cents / total_videos_requested),
-- so the creator gets paid as work is approved instead of all at the end.
-- =====================================================================

alter table public.conversations
  add column if not exists total_videos_requested integer not null default 1,
  add column if not exists videos_completed integer not null default 0;

-- Sanity guard.
alter table public.conversations
  drop constraint if exists conversations_video_counts_check;
alter table public.conversations
  add constraint conversations_video_counts_check
  check (total_videos_requested >= 1 and videos_completed >= 0);

-- Track how many per-video payouts we've already transferred. Lets the
-- release endpoint be idempotent across multiple deliverable approvals.
alter table public.payments
  add column if not exists videos_paid_out integer not null default 0;

notify pgrst, 'reload schema';
