// POST /api/stripe/brand-subscription  { returnTo?, expectTrial? }
// Creates a Stripe Checkout Session for the brand subscription: $1 for 7
// days, then $25/month, for first-time subscribers; $25/month otherwise.
// The prices live in Stripe — STRIPE_BRAND_SUBSCRIPTION_PRICE_ID (monthly)
// and STRIPE_BRAND_TRIAL_FEE_PRICE_ID (the one-time $1).
//
// Signed-in users only: a payment that isn't tied to an account can't unlock
// anything.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe, siteUrl } from "@/lib/stripe/server";
import { safePath } from "@/lib/auth/safePath";
import { checkoutParams } from "@/lib/billing/checkout";
import { customerTrialState } from "@/lib/billing/trial";

// Returns the brand's existing Stripe customer id, creating one if needed
// and persisting it on brand_profiles so future Checkout / Portal sessions
// reuse it. Writes use the service role: users can't write billing columns
// (migration 0048).
async function ensureBrandCustomerId({ admin, user }) {
  // Someone who signed up from /plan has no brand row yet, and the Stripe
  // webhook can only mark a row that exists.
  const { error: rowError } = await admin
    .from("brand_profiles")
    .upsert({ user_id: user.id }, { onConflict: "user_id", ignoreDuplicates: true });
  if (rowError) throw rowError;

  const { data: profile, error: readError } = await admin
    .from("brand_profiles")
    .select("stripe_customer_id, brand_name")
    .eq("user_id", user.id)
    .single();
  if (readError) throw readError;
  if (profile.stripe_customer_id) return profile.stripe_customer_id;

  const customer = await stripe.customers.create({
    email: user.email,
    name: profile.brand_name || undefined,
    metadata: { user_id: user.id },
  });

  const { error } = await admin
    .from("brand_profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("user_id", user.id);
  // Unsaved, the next checkout would make a second customer and offer the
  // trial again.
  if (error) throw error;

  return customer.id;
}

const refuse = (status, error, extra) => NextResponse.json({ error, ...extra }, { status });

export async function POST(request) {
  try {
    const priceId = process.env.STRIPE_BRAND_SUBSCRIPTION_PRICE_ID;
    if (!priceId) return refuse(500, "STRIPE_BRAND_SUBSCRIPTION_PRICE_ID is not set.");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return refuse(401, "Sign in to subscribe.", { signIn: true });

    const body = await request.json().catch(() => ({}));
    const returnTo = safePath(body?.returnTo, "/plan");
    const admin = createAdminClient();

    const [{ data: brand }, { data: creator }] = await Promise.all([
      admin.from("brand_profiles").select("user_id").eq("user_id", user.id).maybeSingle(),
      admin.from("creator_profiles").select("onboarded_at").eq("user_id", user.id).maybeSingle(),
    ]);
    if (!brand && creator?.onboarded_at) {
      return refuse(409, "This is a creator account. Sign up with a different email to subscribe.");
    }

    const customerId = await ensureBrandCustomerId({ admin, user });
    const { live, trialEligible } = await customerTrialState(stripe, customerId);
    if (live) {
      return refuse(409, "You already have a subscription. Manage it under Billing.", {
        alreadySubscribed: true,
      });
    }
    // The page offered $1 but this customer can't have it: don't send them to
    // a checkout for a different price than the button said.
    if (body?.expectTrial === true && !trialEligible) {
      return refuse(
        409,
        "The $1 week is for first-time subscribers, so it's $25/month for you. Refresh to continue.",
      );
    }

    const trialFeePriceId = process.env.STRIPE_BRAND_TRIAL_FEE_PRICE_ID;
    // Never fall back to a free week.
    if (trialEligible && !trialFeePriceId) {
      return refuse(500, "STRIPE_BRAND_TRIAL_FEE_PRICE_ID is not set.");
    }

    const session = await stripe.checkout.sessions.create(
      checkoutParams({
        customerId,
        userId: user.id,
        priceId,
        trialFeePriceId,
        trial: trialEligible,
        base: siteUrl(),
        returnTo,
      }),
    );

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[stripe/brand-subscription]", e);
    return refuse(500, e.message || "Subscription checkout failed.");
  }
}
