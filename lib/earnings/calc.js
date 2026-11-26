// Pure pay math for creator deals. No I/O, so it can be unit-tested
// directly (scripts/test-earnings.mjs) and shared by the crons, the
// RevenueCat webhook and the campaign-creation estimate in the UI.

const DAY_MS = 86400000;

// How long each kind of earning waits before it can be paid out.
//   base     — the brand already approved the video, nothing to wait for
//   cpm      — a week to spot bought views before money moves
//   revshare — App Store refunds land within roughly 30 days
export const HOLD_DAYS = { base: 0, cpm: 7, revshare: 30, adjustment: 0 };

// flagged_reason on a video the brand approved even though it looked
// suspicious, so the daily accrual doesn't flag it again.
export const BRAND_VOUCHED = "brand_vouched";

// A charge request that failed with one of these was rejected by Stripe.
// Any other error (network, Stripe outage) says nothing about whether the
// card was charged.
const DEFINITE_CHARGE_FAILURES = new Set(["StripeCardError", "StripeInvalidRequestError"]);

export function chargeOutcomeUnknown(error) {
  return !DEFINITE_CHARGE_FAILURES.has(error?.type);
}

// What to do with a batch left "charging", given its PaymentIntent (null if
// Stripe has none, so nothing was charged).
export function reconcileAction(intent) {
  if (!intent) return "release";
  if (intent.status === "succeeded") return "settle";
  if (intent.status === "processing") return "wait";
  if (intent.status === "canceled") return "fail";
  return "cancel_then_fail";
}

// Views at or above this with a likes/views ratio below the threshold look
// bought, so the video is flagged for the brand instead of earning CPM.
export const SUSPICIOUS_MIN_VIEWS = 10000;
export const SUSPICIOUS_LIKE_RATIO = 0.005;

export function availableAt(kind, from = new Date()) {
  const days = HOLD_DAYS[kind] ?? 0;
  return new Date(from.getTime() + days * DAY_MS);
}

export function looksSuspicious({ views, likes }) {
  const v = Number(views) || 0;
  if (v < SUSPICIOUS_MIN_VIEWS) return false;
  return (Number(likes) || 0) / v < SUSPICIOUS_LIKE_RATIO;
}

// End of the window during which a video's views earn CPM.
export function viewWindowEnd(postedAt, windowDays) {
  return new Date(new Date(postedAt).getTime() + windowDays * DAY_MS);
}

// Total CPM a video has earned at `views`, before any cap.
export function cpmTotalCents(views, cpmCents) {
  if (!cpmCents || cpmCents <= 0) return 0;
  return Math.floor(((Number(views) || 0) * cpmCents) / 1000);
}

// How much new CPM to credit a video today.
//
// CPM is tracked cumulatively: `previousTargetCents` is the running
// target recorded on the video's last CPM earning (meta.target_cents).
// Crediting the difference means a missed cron day is caught up the next
// day, and a view count that dips (TikTok sometimes revises) never claws
// money back.
//
// The per-video cap covers base + CPM together, so the CPM target is
// limited to (cap - base already earned for that video).
export function cpmIncrement({
  views,
  cpmCents,
  previousTargetCents = 0,
  maxPayoutPerVideoCents = null,
  baseEarnedCents = 0,
}) {
  let target = cpmTotalCents(views, cpmCents);
  if (maxPayoutPerVideoCents != null && maxPayoutPerVideoCents > 0) {
    target = Math.min(target, Math.max(0, maxPayoutPerVideoCents - baseEarnedCents));
  }
  const increment = Math.max(0, target - previousTargetCents);
  return { targetCents: Math.max(target, previousTargetCents), incrementCents: increment };
}

// Clamp an earning so the campaign stays under its monthly cap.
// `spentThisMonthCents` is what the campaign has already accrued this
// calendar month. Returns the amount that fits (possibly 0).
export function applyMonthlyCap(amountCents, { monthlyCapCents, spentThisMonthCents }) {
  if (monthlyCapCents == null || monthlyCapCents <= 0) return amountCents;
  const room = Math.max(0, monthlyCapCents - (spentThisMonthCents || 0));
  return Math.min(amountCents, room);
}

// Creator's share of one subscription payment.
//   priceUsd     — what the subscriber paid (RevenueCat `price`, USD)
//   takehomeRate — share left after the store's cut (0.7 / 0.85)
//   revshareBps  — creator's share in basis points (3000 = 30%)
export function revshareCents({ priceUsd, takehomeRate, revshareBps }) {
  const price = Number(priceUsd) || 0;
  if (price <= 0 || !revshareBps) return 0;
  const net = price * (takehomeRate ?? 1);
  return Math.round(net * 100 * (revshareBps / 10000));
}

// Whether a subscriber attributed at `firstPurchaseAt` still pays the
// creator at `at`. revshareMonths null = lifetime.
export function revshareActive({ firstPurchaseAt, revshareMonths, at = new Date() }) {
  if (revshareMonths == null) return true;
  if (!firstPurchaseAt) return true;
  const start = new Date(firstPurchaseAt);
  const end = new Date(
    Date.UTC(
      start.getUTCFullYear(),
      start.getUTCMonth() + revshareMonths,
      start.getUTCDate(),
      start.getUTCHours(),
      start.getUTCMinutes(),
    ),
  );
  return new Date(at) < end;
}

export function revshareExpiresAt(firstPurchaseAt, revshareMonths) {
  if (revshareMonths == null || !firstPurchaseAt) return null;
  const start = new Date(firstPurchaseAt);
  return new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + revshareMonths, start.getUTCDate()),
  );
}

// What the brand's card is charged for a batch of creator earnings.
// Creators receive their earnings in full; the platform fee and Stripe's
// processing fee are added on top, so a "30% rev share" really is 30%.
export function brandChargeBreakdown(earningsCents, { platformFeeRate, stripeFeePercent, stripeFeeFixedCents }) {
  const platformFeeCents = Math.round(earningsCents * platformFeeRate);
  const subtotal = earningsCents + platformFeeCents;
  const chargeCents = Math.ceil((subtotal + stripeFeeFixedCents) / (1 - stripeFeePercent));
  return {
    earningsCents,
    platformFeeCents,
    processingFeeCents: chargeCents - subtotal,
    chargeCents,
  };
}

// Rough monthly cost for one creator, shown while a brand sets up a
// campaign. Rev share is described separately since it depends on sales.
export function estimateMonthlyCents({
  videosPerMonth,
  payPerVideoCents,
  cpmCents,
  avgViews,
  maxPayoutPerVideoCents,
}) {
  const videos = Math.max(0, Number(videosPerMonth) || 0);
  let perVideo = (payPerVideoCents || 0) + cpmTotalCents(avgViews, cpmCents);
  if (maxPayoutPerVideoCents) perVideo = Math.min(perVideo, maxPayoutPerVideoCents);
  return videos * perVideo;
}

// Start of the calendar month (UTC) containing `date`, for cap tracking.
export function startOfUtcMonth(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

// Short human label for a campaign's pay, e.g.
// "$25/video + $1.00/1K views + 30% rev share".
export function payTermsLabel({ payPerVideoCents, cpmCents, revshareBps }) {
  const fmt = (c) => `$${(c / 100).toFixed(c % 100 ? 2 : 0)}`;
  return (
    [
      payPerVideoCents > 0 && `${fmt(payPerVideoCents)}/video`,
      cpmCents > 0 && `$${(cpmCents / 100).toFixed(2)}/1K views`,
      revshareBps > 0 && `${revshareBps / 100}% rev share`,
    ]
      .filter(Boolean)
      .join(" + ") || "Unpaid"
  );
}
