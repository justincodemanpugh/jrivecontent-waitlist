// POST /api/stripe/add-test-funds
// DEV-ONLY: Creates a test charge using the special Stripe test token
// `tok_bypassPending` which immediately adds funds to your AVAILABLE
// balance (instead of Pending). Use this to unblock payout testing
// when the dashboard top-up flow is disabled in your region.
//
// Usage:
//   curl -X POST http://localhost:3000/api/stripe/add-test-funds \
//     -H 'Content-Type: application/json' \
//     -d '{"amount": 50000, "currency": "cad"}'
import { NextResponse } from "next/server";
import { stripe, getAccountCurrency } from "@/lib/stripe/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  // Hard guard: never allow this in production.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Disabled in production." },
      { status: 403 },
    );
  }

  // Also require a test secret key — refuse to run against live keys.
  const key = process.env.STRIPE_SECRET_KEY || "";
  if (!key.startsWith("sk_test_")) {
    return NextResponse.json(
      { error: "Refusing to run: STRIPE_SECRET_KEY is not a test key." },
      { status: 403 },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const amount = Number(body.amount || 10000); // default $100.00
    // Default to the platform account's currency so the funds land in a
    // balance bucket transfers can actually draw from.
    const currency = body.currency
      ? String(body.currency).toLowerCase()
      : await getAccountCurrency();

    // `tok_bypassPending` is Stripe's test-mode token that skips the
    // pending period and lands money directly in Available balance.
    // See: https://stripe.com/docs/testing#available-balance
    const charge = await stripe.charges.create({
      amount,
      currency,
      source: "tok_bypassPending",
      description: "Test funds for payout testing",
    });

    return NextResponse.json({
      success: true,
      chargeId: charge.id,
      amount,
      currency,
      message: `Added ${(amount / 100).toFixed(2)} ${currency.toUpperCase()} to available balance.`,
    });
  } catch (error) {
    console.error("[add-test-funds]", error);
    return NextResponse.json(
      { error: error.message || "Failed to add test funds." },
      { status: 500 },
    );
  }
}
