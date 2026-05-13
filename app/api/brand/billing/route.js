// GET /api/brand/billing
// Returns the brand's current subscription snapshot for the Settings →
// Billing tab. Also enriches with payment-method preview when the brand
// has an active subscription, so the UI can show "Visa •••• 4242".
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";

const PAID_STATUSES = new Set(["active", "trialing", "past_due"]);

export async function GET() {
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
      .select(
        "stripe_customer_id, stripe_subscription_id, subscription_status, subscription_current_period_end, subscription_cancel_at_period_end",
      )
      .eq("user_id", user.id)
      .maybeSingle();

    const status = profile?.subscription_status || "free";
    const isPaid = PAID_STATUSES.has(status);

    let paymentMethod = null;
    if (isPaid && profile?.stripe_customer_id) {
      try {
        const customer = await stripe.customers.retrieve(
          profile.stripe_customer_id,
          { expand: ["invoice_settings.default_payment_method"] },
        );
        const pm =
          customer && !customer.deleted
            ? customer.invoice_settings?.default_payment_method
            : null;
        if (pm?.card) {
          paymentMethod = {
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year,
          };
        }
      } catch (err) {
        // Non-fatal — the UI just won't show a card preview.
        console.warn("[brand/billing] payment method fetch", err.message);
      }
    }

    return NextResponse.json({
      plan: isPaid ? "pro" : "free",
      status,
      currentPeriodEnd: profile?.subscription_current_period_end || null,
      cancelAtPeriodEnd: !!profile?.subscription_cancel_at_period_end,
      hasCustomer: !!profile?.stripe_customer_id,
      paymentMethod,
    });
  } catch (e) {
    console.error("[brand/billing] GET", e);
    return NextResponse.json(
      { error: e.message || "Could not load billing." },
      { status: 500 },
    );
  }
}
