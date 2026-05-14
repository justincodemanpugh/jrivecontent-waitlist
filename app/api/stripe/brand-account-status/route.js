// POST /api/stripe/brand-account-status
// Brand-only fallback for environments without webhooks. Pulls the
// latest connect-account state from Stripe and mirrors the relevant
// flags onto brand_profiles so the dashboard can render the correct
// status immediately after onboarding completes.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("brand_profiles")
      .select(
        "stripe_account_id, stripe_payouts_enabled, stripe_charges_enabled, stripe_details_submitted",
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile?.stripe_account_id) {
      return NextResponse.json({
        connected: false,
        payouts_enabled: false,
        charges_enabled: false,
        details_submitted: false,
      });
    }

    const account = await stripe.accounts.retrieve(profile.stripe_account_id);
    const payoutsEnabled = !!account.payouts_enabled;
    const chargesEnabled = !!account.charges_enabled;
    const detailsSubmitted = !!account.details_submitted;

    const drift =
      payoutsEnabled !== profile.stripe_payouts_enabled ||
      chargesEnabled !== profile.stripe_charges_enabled ||
      detailsSubmitted !== profile.stripe_details_submitted;

    if (drift) {
      await admin
        .from("brand_profiles")
        .update({
          stripe_payouts_enabled: payoutsEnabled,
          stripe_charges_enabled: chargesEnabled,
          stripe_details_submitted: detailsSubmitted,
        })
        .eq("user_id", user.id);
    }

    return NextResponse.json({
      connected: true,
      payouts_enabled: payoutsEnabled,
      charges_enabled: chargesEnabled,
      details_submitted: detailsSubmitted,
    });
  } catch (e) {
    console.error("[stripe/brand-account-status]", e);
    return NextResponse.json(
      { error: e.message || "Status check failed." },
      { status: 500 },
    );
  }
}
