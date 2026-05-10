// POST /api/stripe/release
// Body: { conversationId }
// Brand-only. Called automatically when the brand approves a deliverable.
// Releases ONE video's worth of payout (gig.pay_per_video minus the 15%
// platform fee) to the creator's Connect account. Idempotent against
// double-release via the `videos_paid_out` counter on payments.
//
// If the creator hasn't connected Stripe yet the release is parked in
// 'released_pending' status and no transfer fires.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe, feeBreakdown } from "@/lib/stripe/server";

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

    // Load payment + conversation + gig (we pay the per-video price set
    // on the gig, not a slice of the lump escrow).
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
    if (payment.status === "pending") {
      return NextResponse.json(
        { error: "Payment hasn't been deposited yet." },
        { status: 400 },
      );
    }

    const { data: conv } = await admin
      .from("conversations")
      .select("total_videos_requested, videos_completed, gig_id")
      .eq("id", conversationId)
      .maybeSingle();

    const { data: gig } = await admin
      .from("gigs")
      .select("pay_per_video")
      .eq("id", conv?.gig_id)
      .maybeSingle();

    const perVideoDollars = Number(gig?.pay_per_video || 0);
    if (perVideoDollars <= 0) {
      return NextResponse.json({ error: "Gig has no price set." }, { status: 400 });
    }
    const perVideoCents = Math.round(perVideoDollars * 100);
    const { creatorPayoutCents: shareCents } = feeBreakdown(perVideoCents);

    const totalVideos = Math.max(1, Number(conv?.total_videos_requested || 1));
    const videosCompleted = Math.max(0, Number(conv?.videos_completed || 0));
    const videosPaidOut = Math.max(0, Number(payment.videos_paid_out || 0));

    // Nothing more to release (caller already paid out for every approval).
    if (videosPaidOut >= videosCompleted) {
      return NextResponse.json({ ok: true, alreadyReleased: true });
    }
    if (videosPaidOut >= totalVideos) {
      return NextResponse.json({ ok: true, alreadyReleased: true });
    }

    const { data: creator } = await admin
      .from("creator_profiles")
      .select("stripe_account_id, stripe_payouts_enabled")
      .eq("user_id", payment.creator_id)
      .maybeSingle();

    if (!creator?.stripe_account_id || !creator?.stripe_payouts_enabled) {
      // Creator hasn't onboarded — park the per-video share in pending.
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
      amount: shareCents,
      currency: "usd",
      destination: creator.stripe_account_id,
      metadata: {
        payment_id: payment.id,
        conversation_id: conversationId,
        video_index: String(videosPaidOut + 1),
        total_videos: String(totalVideos),
      },
    });

    const newPaidOut = videosPaidOut + 1;
    const fullyReleased = newPaidOut >= totalVideos;

    await admin
      .from("payments")
      .update({
        status: fullyReleased ? "released" : "escrowed",
        stripe_transfer_id: transfer.id,
        videos_paid_out: newPaidOut,
        released_at: fullyReleased ? new Date().toISOString() : payment.released_at,
      })
      .eq("id", payment.id);

    return NextResponse.json({
      ok: true,
      transferId: transfer.id,
      videosPaidOut: newPaidOut,
      totalVideos,
    });
  } catch (e) {
    console.error("[stripe/release]", e);
    return NextResponse.json({ error: e.message || "Release failed." }, { status: 500 });
  }
}
