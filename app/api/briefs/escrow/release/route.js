// POST /api/briefs/escrow/release
// Body: { recipientId }
//
// Brand-only. Called when the brand approves a creator's uploaded video.
// Transfers the creator's share (pay_per_creator minus the platform fee)
// from the brand's Connect balance to the creator's Connect account, marks
// the brief_payment 'released' and the brief_recipient approved/completed.
//
// If the creator hasn't connected Stripe yet, the release is parked in
// 'released_pending' and no transfer fires. Idempotent: a second call after
// a successful release is a no-op. Mirrors /api/stripe/release.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe, getAccountCurrency } from "@/lib/stripe/server";

export async function POST(request) {
  try {
    const { recipientId } = await request.json();
    if (!recipientId) {
      return NextResponse.json({ error: "recipientId required" }, { status: 400 });
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: payment, error: payErr } = await admin
      .from("brief_payments")
      .select("*")
      .eq("brief_recipient_id", recipientId)
      .maybeSingle();
    if (payErr) throw payErr;
    if (!payment) {
      return NextResponse.json({ error: "No escrow found." }, { status: 404 });
    }
    if (payment.brand_id !== user.id) {
      return NextResponse.json({ error: "Only the brand can release." }, { status: 403 });
    }
    if (payment.status === "pending") {
      return NextResponse.json(
        { error: "Escrow hasn't been funded yet." },
        { status: 400 },
      );
    }
    if (payment.status === "released") {
      // Already released — ensure recipient reflects approval and return.
      await admin
        .from("brief_recipients")
        .update({
          review_status: "approved",
          status: "completed",
          escrow_status: "released",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", recipientId);
      return NextResponse.json({ ok: true, alreadyReleased: true });
    }

    const shareCents = Number(payment.creator_payout_cents || 0);
    if (shareCents <= 0) {
      return NextResponse.json({ error: "Nothing to release." }, { status: 400 });
    }

    const { data: creator } = await admin
      .from("creator_profiles")
      .select("stripe_account_id, stripe_payouts_enabled")
      .eq("user_id", payment.creator_id)
      .maybeSingle();

    if (!creator?.stripe_account_id || !creator?.stripe_payouts_enabled) {
      // Creator hasn't onboarded — park the payout. Still mark approved so
      // the brand's review is recorded; payout fires when they reconcile.
      await admin
        .from("brief_payments")
        .update({ status: "released_pending" })
        .eq("id", payment.id);
      await admin
        .from("brief_recipients")
        .update({
          review_status: "approved",
          status: "completed",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", recipientId);
      return NextResponse.json({ ok: true, pendingCreatorOnboarding: true });
    }

    const transferCurrency = await getAccountCurrency();
    const brandAccountId = payment.brand_stripe_account_id || null;

    const transferParams = {
      amount: shareCents,
      currency: transferCurrency,
      destination: creator.stripe_account_id,
      metadata: {
        brief_payment_id: payment.id,
        brief_recipient_id: recipientId,
        brief_id: payment.brief_id,
      },
    };

    const transfer = brandAccountId
      ? await stripe.transfers.create(transferParams, {
          stripeAccount: brandAccountId,
        })
      : await stripe.transfers.create(transferParams);

    await admin
      .from("brief_payments")
      .update({
        status: "released",
        stripe_transfer_id: transfer.id,
        released_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    await admin
      .from("brief_recipients")
      .update({
        review_status: "approved",
        status: "completed",
        escrow_status: "released",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", recipientId);

    return NextResponse.json({ ok: true, transferId: transfer.id });
  } catch (e) {
    console.error("[briefs/escrow/release]", e);
    return NextResponse.json({ error: e.message || "Release failed." }, { status: 500 });
  }
}
