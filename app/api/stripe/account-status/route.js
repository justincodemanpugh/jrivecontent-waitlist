// POST /api/stripe/account-status
// Creator-only fallback for environments where the Stripe webhook isn't
// configured (e.g. local dev). Pulls the latest connect-account state from
// Stripe and mirrors `payouts_enabled` onto the creator profile.
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
      .from("creator_profiles")
      .select("stripe_account_id, stripe_payouts_enabled")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile?.stripe_account_id) {
      return NextResponse.json({
        connected: false,
        payouts_enabled: false,
      });
    }

    const account = await stripe.accounts.retrieve(profile.stripe_account_id);
    const payoutsEnabled = !!account.payouts_enabled;

    if (payoutsEnabled !== profile.stripe_payouts_enabled) {
      await admin
        .from("creator_profiles")
        .update({ stripe_payouts_enabled: payoutsEnabled })
        .eq("user_id", user.id);
    }

    return NextResponse.json({
      connected: true,
      payouts_enabled: payoutsEnabled,
      details_submitted: !!account.details_submitted,
    });
  } catch (e) {
    console.error("[stripe/account-status]", e);
    return NextResponse.json(
      { error: e.message || "Status check failed." },
      { status: 500 },
    );
  }
}
