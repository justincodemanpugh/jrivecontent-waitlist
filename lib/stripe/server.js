// Server-only Stripe client. Never import from a client component.
// Lazy-initialized so `next build` doesn't fail when STRIPE_SECRET_KEY
// is missing at build time.
import Stripe from "stripe";

let _stripe = null;
function getStripe() {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to your .env.local.",
    );
  }
  _stripe = new Stripe(key, { apiVersion: "2024-06-20", typescript: false });
  return _stripe;
}

// Proxy so callers can keep doing `stripe.checkout.sessions.create(...)`.
export const stripe = new Proxy(
  {},
  {
    get(_t, prop) {
      const client = getStripe();
      const value = client[prop];
      return typeof value === "function" ? value.bind(client) : value;
    },
  },
);

export const PLATFORM_FEE_RATE = Number(process.env.PLATFORM_FEE_RATE || "0.05");

export function feeBreakdown(amountCents) {
  const platformFeeCents = Math.round(amountCents * PLATFORM_FEE_RATE);
  const creatorPayoutCents = amountCents - platformFeeCents;
  return { amountCents, platformFeeCents, creatorPayoutCents };
}

// Stripe US card pricing baseline: 2.9% + 30¢ per successful charge.
// We "gross up" the brand's checkout total so that AFTER Stripe takes its
// processing fee, the net landing in the brand's Connect balance still
// equals the gig subtotal. The brand absorbs the processing fee (shown as
// a separate line item at checkout) so the platform fee and the
// creator's payout both stay whole.
export const STRIPE_FEE_PERCENT = Number(
  process.env.STRIPE_FEE_PERCENT || "0.029",
);
export const STRIPE_FEE_FIXED_CENTS = Number(
  process.env.STRIPE_FEE_FIXED_CENTS || "30",
);

export function grossUpForStripeFee(targetCents) {
  if (!targetCents || targetCents <= 0) return targetCents;
  const gross = Math.ceil(
    (targetCents + STRIPE_FEE_FIXED_CENTS) / (1 - STRIPE_FEE_PERCENT),
  );
  return gross;
}

export function processingFeeFor(targetCents) {
  return Math.max(0, grossUpForStripeFee(targetCents) - targetCents);
}

// Returns the platform Stripe account's default currency (e.g. "cad", "usd").
// Cached for the lifetime of the server process so we don't hit the API on
// every transfer. Falls back to "usd" if the lookup fails.
let _accountCurrency = null;
export async function getAccountCurrency() {
  if (_accountCurrency) return _accountCurrency;
  try {
    const account = await getStripe().accounts.retrieve();
    _accountCurrency = (account.default_currency || "usd").toLowerCase();
  } catch (err) {
    console.warn(
      "[stripe] Could not fetch account currency, defaulting to usd:",
      err.message,
    );
    _accountCurrency = "usd";
  }
  return _accountCurrency;
}

export function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    "https://www.jrivecontent.com"
  );
}
