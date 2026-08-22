-- =====================================================================
-- Program test payouts.
--
-- Brands want to pay a new creator a small flat amount up front — a "test
-- video" fee — so they can see whether that creator is a fit before the
-- normal per-period, video-gated payout cycle starts. A test payout is
-- released without requiring any posted video, and each program member can
-- only ever receive one.
-- =====================================================================

alter table public.programs
  add column if not exists test_payout_amount_cents integer;
  -- null or 0 = this program does not offer a test payout

alter table public.program_payouts
  add column if not exists payout_type text not null default 'period';
  -- 'period' : normal cycle payout, gated on videos posted in the period
  -- 'test'   : one-time flat onboarding payout, no videos required

alter table public.program_payouts
  drop constraint if exists program_payouts_payout_type_check;
alter table public.program_payouts
  add constraint program_payouts_payout_type_check
  check (payout_type in ('period', 'test'));

-- Test payouts have no billing period. The existing
-- unique (program_member_id, period_start, period_end) constraint treats
-- NULLs as distinct, so it no longer guards test rows — the partial index
-- below is what enforces one-per-member.
alter table public.program_payouts
  alter column period_start drop not null,
  alter column period_end drop not null;

alter table public.program_payouts
  drop constraint if exists program_payouts_period_required_check;
alter table public.program_payouts
  add constraint program_payouts_period_required_check
  check (
    payout_type <> 'period'
    or (period_start is not null and period_end is not null)
  );

create unique index if not exists program_payouts_one_test_per_member
  on public.program_payouts (program_member_id)
  where payout_type = 'test';
