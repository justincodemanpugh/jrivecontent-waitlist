// POST /api/stripe/brand-subscription
// Creates a Stripe Checkout Session for the $25/mo brand platform subscription.
// The actual product/price lives in Stripe — we reference it via
// STRIPE_BRAND_SUBSCRIPTION_PRICE_ID in .env.local.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, siteUrl } from "@/lib/stripe/server";

// Returns the brand's existing Stripe customer id, creating one if needed
// and persisting it on brand_profiles so future Checkout / Portal sessions
// reuse it.
async function ensureBrandCustomerId({ supabase, user }) {
  const { data: profile } = await supabase
    .from("brand_profiles")
    .select("stripe_customer_id, brand_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.stripe_customer_id) return profile.stripe_customer_id;

  const customer = await stripe.customers.create({
    email: user.email,
    name: profile?.brand_name || undefined,
    metadata: { user_id: user.id },
  });

  await supabase
    .from("brand_profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("user_id", user.id);

  return customer.id;
}

export async function POST(request) {
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

    // Optional return path so Settings → Billing can send the user back to
    // the same tab after Checkout instead of the dashboard home.
    let returnTo = null;
    try {
      const body = await request.json();
      returnTo = typeof body?.returnTo === "string" ? body.returnTo : null;
    } catch {
      // No body — fine, fall back to default redirect.
    }

    const successPath = returnTo || "/dashboard/brand?subscription=success";
    const cancelPath = returnTo || "/?subscription=cancel#pricing";

    const customerId = user
      ? await ensureBrandCustomerId({ supabase, user })
      : null;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      // Prefer reusing the saved customer when signed in so payment methods
      // and invoices live on one Stripe customer record.
      ...(customerId
        ? { customer: customerId }
        : user?.email
          ? { customer_email: user.email }
          : {}),
      success_url: `${base}${successPath}`,
      cancel_url: `${base}${cancelPath}`,
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
