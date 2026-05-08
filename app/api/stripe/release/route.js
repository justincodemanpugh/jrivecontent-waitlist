// POST /api/stripe/release
// Body: { conversationId }
// Brand-only. Called automatically when the brand approves a deliverable.
// Transfers (amount - platform fee) to the creator's Connect account.
// If the creator hasn't connected Stripe yet, the payment is marked
// 'released_pending' and will need to be transferred once they do.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/server";

export async function POST(request) {
  try {
    const { conversationId } = await request.json();
    if (!conversationId) {
      return NextResponse.json({ error: "conversationId required" }, { status: 400 });
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const admin = createAdminClient();

    // Load payment + creator profile (for Connect account id).
    const { data: payment, error: payErr } = await admin
      .from("payments")
      .select("*")
      .eq("conversation_id", conversationId)
      .maybeSingle();
    if (payErr) throw payErr;
    if (!payment) {
      return NextResponse.json({ error: "No payment found." }, { status: 404 });
    }
    if (payment.brand_id !== user.id) {
      return NextResponse.json({ error: "Only the brand can release." }, { status: 403 });
    }
    if (payment.status === "released") {
      return NextResponse.json({ ok: true, alreadyReleased: true });
    }
    if (payment.status !== "escrowed") {
      return NextResponse.json(
        { error: `Payment not in escrow (status=${payment.status}).` },
        { status: 400 },
      );
    }

    const { data: creator } = await admin
      .from("creator_profiles")
      .select("stripe_account_id, stripe_payouts_enabled")
      .eq("user_id", payment.creator_id)
      .maybeSingle();

    // If creator hasn't onboarded with Stripe yet, mark as pending payout.
    // The brand has approved; money will sit in platform balance until the
    // creator connects, at which point we can run a manual transfer.
    if (!creator?.stripe_account_id || !creator?.stripe_payouts_enabled) {
      await admin
        .from("payments")
        .update({ status: "released_pending" })
        .eq("id", payment.id);
      return NextResponse.json({
        ok: true,
        pendingCreatorOnboarding: true,
      });
    }

    const transfer = await stripe.transfers.create({
      amount: payment.creator_payout_cents,
      currency: "usd",
      destination: creator.stripe_account_id,
      metadata: {
        payment_id: payment.id,
        conversation_id: conversationId,
      },
    });

    await admin
      .from("payments")
      .update({
        status: "released",
        stripe_transfer_id: transfer.id,
        released_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    return NextResponse.json({ ok: true, transferId: transfer.id });
  } catch (e) {
    console.error("[stripe/release]", e);
    return NextResponse.json({ error: e.message || "Release failed." }, { status: 500 });
  }
}
