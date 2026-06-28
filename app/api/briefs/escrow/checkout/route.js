// POST /api/briefs/escrow/checkout
// Body: { recipientId }   <- the brief_recipients.id to fund
//
// Brand-only. Funds escrow for ONE creator on a brief. Creates (or reuses)
// a brief_payments row and returns a Stripe Checkout Session URL. The webhook
// flips the brief_payment to 'escrowed' and brief_recipients.escrow_status
// once the brand actually pays. Mirrors /api/stripe/checkout.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  stripe,
  feeBreakdown,
  processingFeeFor,
  siteUrl,
} from "@/lib/stripe/server";

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

    // Load the recipient + parent brief (for price + brand ownership).
    const { data: recipient, error: recErr } = await admin
      .from("brief_recipients")
      .select(
        `id, creator_id, escrow_status,
         brief:briefs ( id, brand_id, title, pay_per_creator )`,
      )
      .eq("id", recipientId)
      .maybeSingle();
    if (recErr) throw recErr;
    if (!recipient) {
      return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    }

    const brief = recipient.brief;
    if (!brief || brief.brand_id !== user.id) {
      return NextResponse.json(
        { error: "Only the brand can fund this assignment." },
        { status: 403 },
      );
    }
    if (recipient.escrow_status === "escrowed" || recipient.escrow_status === "released") {
      return NextResponse.json({ error: "Already funded." }, { status: 400 });
    }

    const perCreator = Number(brief.pay_per_creator || 0);
    if (!perCreator || perCreator <= 0) {
      return NextResponse.json(
        { error: "Set a payment per creator on this brief first." },
        { status: 400 },
      );
    }

    // Brand must have completed Connect onboarding (destination charge flow).
    const { data: brandProfile } = await admin
      .from("brand_profiles")
      .select("stripe_account_id, stripe_charges_enabled")
      .eq("user_id", brief.brand_id)
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

    const amountCents = Math.round(perCreator * 100);
    const breakdown = feeBreakdown(amountCents);
    const processingFeeCents = processingFeeFor(amountCents);

    // Upsert a pending escrow row for this recipient.
    const { data: payment, error: payErr } = await admin
      .from("brief_payments")
      .upsert(
        {
          brief_recipient_id: recipient.id,
          brief_id: brief.id,
          brand_id: brief.brand_id,
          creator_id: recipient.creator_id,
          amount_cents: breakdown.amountCents,
          platform_fee_cents: breakdown.platformFeeCents,
          creator_payout_cents: breakdown.creatorPayoutCents,
          brand_stripe_account_id: brandStripeAccountId,
          status: "pending",
        },
        { onConflict: "brief_recipient_id" },
      )
      .select()
      .single();
    if (payErr) throw payErr;

    await admin
      .from("brief_recipients")
      .update({ escrow_status: "pending" })
      .eq("id", recipient.id);

    const base = siteUrl();
    const sharedMetadata = {
      kind: "brief",
      brief_payment_id: payment.id,
      brief_recipient_id: recipient.id,
      brief_id: brief.id,
      brand_id: brief.brand_id,
      creator_id: recipient.creator_id,
      subtotal_cents: String(breakdown.amountCents),
      platform_fee_cents: String(breakdown.platformFeeCents),
      creator_payout_cents: String(breakdown.creatorPayoutCents),
      processing_fee_cents: String(processingFeeCents),
      brand_stripe_account_id: brandStripeAccountId,
    };

    const lineItems = [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: {
            name: `${brief.title || "Brief"} — Escrow deposit`,
            description:
              "Funds held in escrow until you approve the creator's video.",
          },
        },
      },
    ];

    if (processingFeeCents > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: processingFeeCents,
          product_data: {
            name: "Payment processing fee",
            description:
              "Covers card-network fees so 100% of the pay reaches escrow.",
          },
        },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      success_url: `${base}/dashboard/brand/briefs/${brief.id}?deposit=success`,
      cancel_url: `${base}/dashboard/brand/briefs/${brief.id}?deposit=cancel`,
      metadata: sharedMetadata,
      payment_intent_data: {
        application_fee_amount: breakdown.platformFeeCents,
        on_behalf_of: brandStripeAccountId,
        transfer_data: {
          destination: brandStripeAccountId,
        },
        metadata: sharedMetadata,
      },
    });

    await admin
      .from("brief_payments")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", payment.id);

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[briefs/escrow/checkout]", e);
    return NextResponse.json({ error: e.message || "Checkout failed." }, { status: 500 });
  }
}
