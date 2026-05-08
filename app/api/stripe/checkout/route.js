// POST /api/stripe/checkout
// Body: { conversationId }
// Brand-only. Creates (or reuses) a payment row and returns a Stripe
// Checkout Session URL. The webhook handles flipping the payment to
// 'escrowed' once the brand actually pays.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe, feeBreakdown, siteUrl } from "@/lib/stripe/server";

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

    // Pull conversation + gig price. RLS allows only members.
    const { data: conv, error: convErr } = await supabase
      .from("conversations")
      .select(
        `id, brand_id, creator_id, gig_id, payment_deposited,
         gig:gigs ( id, title, pay_per_video )`,
      )
      .eq("id", conversationId)
      .maybeSingle();
    if (convErr) throw convErr;
    if (!conv) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }
    if (conv.brand_id !== user.id) {
      return NextResponse.json({ error: "Only the brand can deposit." }, { status: 403 });
    }
    if (conv.payment_deposited) {
      return NextResponse.json({ error: "Already deposited." }, { status: 400 });
    }

    const dollars = Number(conv.gig?.pay_per_video || 0);
    if (!dollars || dollars <= 0) {
      return NextResponse.json({ error: "Gig has no price set." }, { status: 400 });
    }
    const amountCents = Math.round(dollars * 100);
    const breakdown = feeBreakdown(amountCents);

    const admin = createAdminClient();

    // Upsert pending payment row (idempotent on conversation_id).
    const { data: payment, error: payErr } = await admin
      .from("payments")
      .upsert(
        {
          conversation_id: conv.id,
          gig_id: conv.gig_id,
          brand_id: conv.brand_id,
          creator_id: conv.creator_id,
          amount_cents: breakdown.amountCents,
          platform_fee_cents: breakdown.platformFeeCents,
          creator_payout_cents: breakdown.creatorPayoutCents,
          status: "pending",
        },
        { onConflict: "conversation_id" },
      )
      .select()
      .single();
    if (payErr) throw payErr;

    const base = siteUrl();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: conv.gig?.title || "Gig deposit",
              description: "Funds held in escrow until you approve the deliverable.",
            },
          },
        },
      ],
      success_url: `${base}/dashboard/brand/messages/${conv.id}?deposit=success`,
      cancel_url: `${base}/dashboard/brand/messages/${conv.id}?deposit=cancel`,
      metadata: {
        payment_id: payment.id,
        conversation_id: conv.id,
        brand_id: conv.brand_id,
        creator_id: conv.creator_id,
      },
      payment_intent_data: {
        metadata: {
          payment_id: payment.id,
          conversation_id: conv.id,
        },
      },
    });

    await admin
      .from("payments")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", payment.id);

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[stripe/checkout]", e);
    return NextResponse.json({ error: e.message || "Checkout failed." }, { status: 500 });
  }
}
