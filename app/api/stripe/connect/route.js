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
      .select("user_id, stripe_account_id, country")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!profile) {
      return NextResponse.json(
        { error: "Finish creator onboarding first." },
        { status: 400 },
      );
    }

    let accountId = profile.stripe_account_id;
    let account = null;
    if (!accountId) {
      // Stripe locks the country of a connected account at creation time
      // and it can never be changed. Require the user to pick their country
      // in their profile first so we don't silently lock them to our
      // platform's default country.
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
        metadata: { user_id: user.id },
      });
      accountId = account.id;
      await admin
        .from("creator_profiles")
        .update({ stripe_account_id: accountId })
        .eq("user_id", user.id);
    } else {
      account = await stripe.accounts.retrieve(accountId);
    }

    const base = siteUrl();

    // If the account already finished onboarding, send the creator to the
    // Express Dashboard to actually manage their account, balance, payouts,
    // etc. Otherwise, send them through the onboarding flow.
    if (account?.details_submitted) {
      const loginLink = await stripe.accounts.createLoginLink(accountId);
      // newTab tells the client to open the Express Dashboard in a new tab
      // so the creator's original tab stays on their profile page (Stripe
      // hosts the dashboard and we can't inject a "back to profile" link).
      return NextResponse.json({ url: loginLink.url, newTab: true });
    }

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
