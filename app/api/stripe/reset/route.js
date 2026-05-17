// POST /api/stripe/reset
//
// "Reset" (i.e. disconnect + delete) the signed-in user's Stripe Connect
// account. Necessary because Stripe locks the *country* of a connected
// account at creation time and never lets it be changed. Users who got
// their account auto-created on the wrong country (back when we didn't
// pass a dynamic `country`) are stuck with that jurisdiction unless we
// delete the account and let them connect again with the correct country.
//
// What this does:
//   1. Refuses to act unless the user has a connected Stripe account.
//   2. Calls `stripe.accounts.del(accountId)`. Stripe itself enforces all
//      the "is it safe to delete?" rules — a non-zero balance, pending
//      payouts, negative balance liability, live charges, etc. will make
//      Stripe return an error, which we surface verbatim to the user.
//   3. On success, clears the local `stripe_account_id` and Connect status
//      flags so the UI flips back to "Not connected" and the user can
//      reconnect with their (now correctly-set) country.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/server";

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

    // Try brand first, then creator. Either one (or neither) may have a
    // connected account; we reset whichever one does.
    const [{ data: brand }, { data: creator }] = await Promise.all([
      admin
        .from("brand_profiles")
        .select("user_id, stripe_account_id")
        .eq("user_id", user.id)
        .maybeSingle(),
      admin
        .from("creator_profiles")
        .select("user_id, stripe_account_id")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    const target = brand?.stripe_account_id
      ? { table: "brand_profiles", accountId: brand.stripe_account_id }
      : creator?.stripe_account_id
        ? { table: "creator_profiles", accountId: creator.stripe_account_id }
        : null;

    if (!target) {
      return NextResponse.json(
        { error: "No Stripe account is connected." },
        { status: 400 },
      );
    }

    // Attempt to delete the connected account at Stripe. Stripe will
    // refuse (with a descriptive error) if the account has a balance,
    // pending payouts, or other unresolved state. We pass that message
    // through to the user instead of silently leaving the account live.
    try {
      await stripe.accounts.del(target.accountId);
    } catch (stripeErr) {
      // If the account simply no longer exists at Stripe (e.g. deleted
      // out-of-band from the dashboard), treat that as success and just
      // clear our local link.
      const code = stripeErr?.code || stripeErr?.raw?.code;
      const notFound =
        code === "resource_missing" ||
        stripeErr?.statusCode === 404 ||
        stripeErr?.raw?.statusCode === 404;
      if (!notFound) {
        return NextResponse.json(
          {
            error:
              stripeErr?.raw?.message ||
              stripeErr?.message ||
              "Stripe refused to delete the account.",
          },
          { status: 400 },
        );
      }
    }

    // Clear the local link + cached status flags. We re-zero the brand
    // status booleans because they only make sense for the now-deleted
    // account. The next /api/stripe/(brand-)account-status call will
    // refill them from the freshly-created account.
    const patch =
      target.table === "brand_profiles"
        ? {
            stripe_account_id: null,
            stripe_payouts_enabled: false,
            stripe_charges_enabled: false,
            stripe_details_submitted: false,
          }
        : {
            stripe_account_id: null,
            stripe_payouts_enabled: false,
          };

    const { error: updateErr } = await admin
      .from(target.table)
      .update(patch)
      .eq("user_id", user.id);

    if (updateErr) {
      console.error("[stripe/reset] local clear failed", updateErr);
      return NextResponse.json(
        {
          error:
            "Stripe account was deleted, but we couldn't update your profile. Please refresh.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[stripe/reset]", e);
    return NextResponse.json(
      { error: e.message || "Could not reset Stripe account." },
      { status: 500 },
    );
  }
}
