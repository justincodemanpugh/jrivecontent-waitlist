// POST /api/programs/payouts/checkout
// Body: { programMemberId, periodStart, periodEnd }  <- ISO date strings
//
// Brand-only. Computes (or reuses) the payout for one creator's program
// membership over a billing period — video_count * pay_per_video_cents,
// capped at the program's video target — and returns a Stripe Checkout
// Session URL that funds escrow. Mirrors /api/briefs/escrow/checkout.
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
    const { programMemberId, periodStart, periodEnd } = await request.json();
    if (!programMemberId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: "programMemberId, periodStart, and periodEnd are required" },
        { status: 400 },
      );
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: member, error: memErr } = await admin
      .from("program_members")
      .select(
        `id, creator_id,
         program:programs ( id, brand_id, title, pay_per_video_cents, videos_per_period )`,
      )
      .eq("id", programMemberId)
      .maybeSingle();
    if (memErr) throw memErr;
    if (!member) {
      return NextResponse.json({ error: "Program member not found." }, { status: 404 });
    }

    const program = member.program;
    if (!program || program.brand_id !== user.id) {
      return NextResponse.json(
        { error: "Only the brand can fund this payout." },
        { status: 403 },
      );
    }

    const { count: videoCount } = await admin
      .from("program_videos")
      .select("id", { count: "exact", head: true })
      .eq("program_member_id", programMemberId)
      .gte("posted_at", periodStart)
      .lt("posted_at", periodEnd);

    const billableVideos = Math.min(videoCount || 0, program.videos_per_period);
    const amountCents = billableVideos * program.pay_per_video_cents;
    if (amountCents <= 0) {
      return NextResponse.json(
        { error: "No billable videos posted in this period yet." },
        { status: 400 },
      );
    }

    const { data: brandProfile } = await admin
      .from("brand_profiles")
      .select("stripe_account_id, stripe_charges_enabled")
      .eq("user_id", program.brand_id)
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

    const breakdown = feeBreakdown(amountCents);
    const processingFeeCents = processingFeeFor(amountCents);

    const { data: payout, error: payoutErr } = await admin
      .from("program_payouts")
      .upsert(
        {
          program_member_id: programMemberId,
          program_id: program.id,
          brand_id: program.brand_id,
          creator_id: member.creator_id,
          period_start: periodStart,
          period_end: periodEnd,
          video_count: billableVideos,
          amount_cents: breakdown.amountCents,
          platform_fee_cents: breakdown.platformFeeCents,
          creator_payout_cents: breakdown.creatorPayoutCents,
          brand_stripe_account_id: brandStripeAccountId,
          status: "pending",
        },
        { onConflict: "program_member_id,period_start,period_end" },
      )
      .select()
      .single();
    if (payoutErr) throw payoutErr;

    const base = siteUrl();
    const sharedMetadata = {
      kind: "program_payout",
      program_payout_id: payout.id,
      program_member_id: programMemberId,
      program_id: program.id,
      brand_id: program.brand_id,
      creator_id: member.creator_id,
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
            name: `${program.title || "Program"} — ${billableVideos} video${billableVideos !== 1 ? "s" : ""}`,
            description: "Funds held in escrow until released to the creator.",
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
      success_url: `${base}/dashboard/brand/programs/${program.id}?deposit=success`,
      cancel_url: `${base}/dashboard/brand/programs/${program.id}?deposit=cancel`,
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
      .from("program_payouts")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", payout.id);

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[programs/payouts/checkout]", e);
    return NextResponse.json({ error: e.message || "Checkout failed." }, { status: 500 });
  }
}
