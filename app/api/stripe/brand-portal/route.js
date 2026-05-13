// POST /api/stripe/brand-portal
// Returns a Stripe Customer Portal URL so the brand can manage their
// subscription (cancel / resume) and update their payment method without
// us ever touching card data.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, siteUrl } from "@/lib/stripe/server";

export async function POST(request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("brand_profiles")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No Stripe customer yet. Subscribe first to manage billing." },
        { status: 400 },
      );
    }

    let returnTo = "/dashboard/brand/settings/billing";
    try {
      const body = await request.json();
      if (typeof body?.returnTo === "string") returnTo = body.returnTo;
    } catch {
      // No body — fine.
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${siteUrl()}${returnTo}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[stripe/brand-portal]", e);
    return NextResponse.json(
      { error: e.message || "Could not open billing portal." },
      { status: 500 },
    );
  }
}
