// POST /api/stripe/checkout
// Body:
//   { conversationId, videoCount? }   <- initial deposit
//   { conversationId, additionalVideos: N }  <- top up for more videos
//
// Brand-only. Creates (or reuses) a payment row and returns a Stripe
// Checkout Session URL. The webhook handles flipping the payment to
// 'escrowed' once the brand actually pays.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe, feeBreakdown, siteUrl } from "@/lib/stripe/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { conversationId } = body;
    const additionalVideos = Number(body.additionalVideos || 0);
    const videoCountInput = Number(body.videoCount || 1);

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
         total_videos_requested, videos_completed,
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

    // Require the brand to have completed Connect onboarding before they
    // can deposit. New architecture: deposits land in the brand's own
    // Stripe Connect balance via a destination charge, and the platform
    // takes its cut as an application_fee_amount.
    const admin0 = createAdminClient();
    const { data: brandProfile } = await admin0
      .from("brand_profiles")
      .select("stripe_account_id, stripe_charges_enabled")
      .eq("user_id", conv.brand_id)
      .maybeSingle();
    if (!brandProfile?.stripe_account_id || !brandProfile?.stripe_charges_enabled) {
      return NextResponse.json(
        {
          error:
            "Connect your brand Stripe account before depositing. Go to Settings → Billing.",
          code: "brand_connect_required",
        },
        { status: 400 },
      );
    }
    const brandStripeAccountId = brandProfile.stripe_account_id;

    const perVideo = Number(conv.gig?.pay_per_video || 0);
    if (!perVideo || perVideo <= 0) {
      return NextResponse.json({ error: "Gig has no price set." }, { status: 400 });
    }

    const isAdditional = additionalVideos > 0;

    if (isAdditional && !conv.payment_deposited) {
      return NextResponse.json(
        { error: "Make the initial deposit first." },
        { status: 400 },
      );
    }
    if (!isAdditional && conv.payment_deposited) {
      return NextResponse.json({ error: "Already deposited." }, { status: 400 });
    }

    // Number of videos this checkout session is paying for.
    const videosForThisCheckout = isAdditional
      ? Math.max(1, Math.floor(additionalVideos))
      : Math.max(1, Math.floor(videoCountInput));

    const perVideoCents = Math.round(perVideo * 100);
    const amountCents = perVideoCents * videosForThisCheckout;
    const breakdown = feeBreakdown(amountCents);

    const admin = admin0;

    let paymentId;
    if (isAdditional) {
      // Top up: read existing payment row so the webhook can add to it.
      const { data: existing, error: exErr } = await admin
        .from("payments")
        .select("id")
        .eq("conversation_id", conv.id)
        .maybeSingle();
      if (exErr) throw exErr;
      if (!existing) {
        return NextResponse.json({ error: "No payment row found." }, { status: 400 });
      }
      paymentId = existing.id;
    } else {
      // Initial deposit: upsert a pending payment row sized for the chosen
      // number of videos.
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
            brand_stripe_account_id: brandStripeAccountId,
            status: "pending",
          },
          { onConflict: "conversation_id" },
        )
        .select()
        .single();
      if (payErr) throw payErr;
      paymentId = payment.id;

      // Reflect chosen quantity on the conversation immediately so the UI
      // banner shows the right total even before checkout completes.
      await admin
        .from("conversations")
        .update({ total_videos_requested: videosForThisCheckout })
        .eq("id", conv.id);
    }

    const base = siteUrl();
    // Brand-as-merchant flow: the charge is destination-routed to the
    // brand's connected account, and we collect our 15% as an
    // application_fee_amount on the PaymentIntent. After payment clears,
    // (amount - application_fee) lands in the brand's Connect balance and
    // becomes our escrow pool for that conversation.
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: videosForThisCheckout,
          price_data: {
            currency: "usd",
            unit_amount: perVideoCents,
            product_data: {
              name: `${conv.gig?.title || "Gig deposit"}${
                videosForThisCheckout > 1 ? ` (${videosForThisCheckout} videos)` : ""
              }`,
              description: isAdditional
                ? "Additional videos — added to existing escrow."
                : "Funds held in escrow until you approve each video.",
            },
          },
        },
      ],
      success_url: `${base}/dashboard/brand/messages/${conv.id}?deposit=success`,
      cancel_url: `${base}/dashboard/brand/messages/${conv.id}?deposit=cancel`,
      metadata: {
        payment_id: paymentId,
        conversation_id: conv.id,
        brand_id: conv.brand_id,
        creator_id: conv.creator_id,
        kind: isAdditional ? "additional" : "initial",
        videos: String(videosForThisCheckout),
        brand_stripe_account_id: brandStripeAccountId,
      },
      payment_intent_data: {
        application_fee_amount: breakdown.platformFeeCents,
        transfer_data: {
          destination: brandStripeAccountId,
        },
        metadata: {
          payment_id: paymentId,
          conversation_id: conv.id,
          kind: isAdditional ? "additional" : "initial",
          videos: String(videosForThisCheckout),
          brand_stripe_account_id: brandStripeAccountId,
        },
      },
    });

    if (!isAdditional) {
      await admin
        .from("payments")
        .update({ stripe_checkout_session_id: session.id })
        .eq("id", paymentId);
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[stripe/checkout]", e);
    return NextResponse.json({ error: e.message || "Checkout failed." }, { status: 500 });
  }
}
