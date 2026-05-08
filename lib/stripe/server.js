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

export const PLATFORM_FEE_RATE = Number(process.env.PLATFORM_FEE_RATE || "0.15");

export function feeBreakdown(amountCents) {
  const platformFeeCents = Math.round(amountCents * PLATFORM_FEE_RATE);
  const creatorPayoutCents = amountCents - platformFeeCents;
  return { amountCents, platformFeeCents, creatorPayoutCents };
}

export function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    "http://localhost:3000"
  );
}
