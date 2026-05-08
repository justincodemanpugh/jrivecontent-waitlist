// POST /api/stripe/connect
// Creator-only. Creates (or reuses) a Stripe Connect Express account for
// the current creator and returns an onboarding link. The creator is
// redirected to Stripe, completes KYC, then comes back to our return URL.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe, siteUrl } from "@/lib/stripe/server";

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
      .select("user_id, stripe_account_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!profile) {
      return NextResponse.json(
        { error: "Finish creator onboarding first." },
        { status: 400 },
      );
    }

    let accountId = profile.stripe_account_id;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email || undefined,
        capabilities: {
          transfers: { requested: true },
        },
        metadata: { user_id: user.id },
      });
      accountId = account.id;
      await admin
        .from("creator_profiles")
        .update({ stripe_account_id: accountId })
        .eq("user_id", user.id);
    }

    const base = siteUrl();
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${base}/dashboard/creator/profile?stripe=refresh`,
      return_url: `${base}/dashboard/creator/profile?stripe=connected`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: link.url });
  } catch (e) {
    console.error("[stripe/connect]", e);
    return NextResponse.json({ error: e.message || "Connect failed." }, { status: 500 });
  }
}
