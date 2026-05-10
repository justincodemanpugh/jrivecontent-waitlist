// POST /api/stripe/brand-subscription
// Creates a Stripe Checkout Session for the $25/mo brand platform subscription.
// The actual product/price lives in Stripe — we reference it via
// STRIPE_BRAND_SUBSCRIPTION_PRICE_ID in .env.local.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, siteUrl } from "@/lib/stripe/server";

export async function POST() {
  try {
    const priceId = process.env.STRIPE_BRAND_SUBSCRIPTION_PRICE_ID;
    if (!priceId) {
      return NextResponse.json(
        { error: "STRIPE_BRAND_SUBSCRIPTION_PRICE_ID is not set." },
        { status: 500 },
      );
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const base = siteUrl();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      // If the user is signed in, prefill their email + tag the session.
      ...(user?.email ? { customer_email: user.email } : {}),
      success_url: `${base}/dashboard/brand?subscription=success`,
      cancel_url: `${base}/?subscription=cancel#pricing`,
      allow_promotion_codes: true,
      metadata: user
        ? { user_id: user.id, plan: "brand_monthly" }
        : { plan: "brand_monthly" },
      subscription_data: {
        metadata: user
          ? { user_id: user.id, plan: "brand_monthly" }
          : { plan: "brand_monthly" },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[stripe/brand-subscription]", e);
    return NextResponse.json(
      { error: e.message || "Subscription checkout failed." },
      { status: 500 },
    );
  }
}
