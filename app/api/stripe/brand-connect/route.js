// POST /api/stripe/brand-connect
// Brand-only. Creates (or reuses) a Stripe Connect Express account for
// the current brand and returns an onboarding link. After KYC the brand
// is sent back to the Payouts settings tab.
//
// Mirrors the creator-side /api/stripe/connect route, but requests both
// `card_payments` (so we can land deposit funds in the brand's account
// via a destination charge) and `transfers` (so we can move the per-
// video share to the creator's connected account on approval).
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
      .from("brand_profiles")
      .select("user_id, stripe_account_id, country")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!profile) {
      return NextResponse.json(
        { error: "Finish brand onboarding first." },
        { status: 400 },
      );
    }

    let accountId = profile.stripe_account_id;
    let account = null;
    if (!accountId) {
      // Stripe locks the country of a connected account at creation time
      // and it can never be changed. Require the brand to pick their
      // country first so we don't silently lock them to our platform's
      // default country.
      const country =
        typeof profile.country === "string" && /^[A-Z]{2}$/.test(profile.country)
          ? profile.country
          : null;
      if (!country) {
        return NextResponse.json(
          {
            error:
              "Please set your country in your profile before connecting Stripe.",
            code: "country_required",
          },
          { status: 400 },
        );
      }

      account = await stripe.accounts.create({
        type: "express",
        country,
        email: user.email || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "company",
        metadata: { user_id: user.id, role: "brand" },
      });
      accountId = account.id;
      await admin
        .from("brand_profiles")
        .update({ stripe_account_id: accountId })
        .eq("user_id", user.id);
    } else {
      account = await stripe.accounts.retrieve(accountId);
    }

    const base = siteUrl();

    // If onboarding is already done, deep-link to the Express Dashboard so
    // they can manage their connected account.
    if (account?.details_submitted) {
      const loginLink = await stripe.accounts.createLoginLink(accountId);
      return NextResponse.json({ url: loginLink.url, newTab: true });
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${base}/dashboard/brand/settings/billing?stripe=refresh`,
      return_url: `${base}/dashboard/brand/settings/billing?stripe=connected`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: link.url });
  } catch (e) {
    console.error("[stripe/brand-connect]", e);
    return NextResponse.json(
      { error: e.message || "Connect failed." },
      { status: 500 },
    );
  }
}
