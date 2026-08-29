// POST /api/programs/payouts/checkout
// Body: { programMemberId, periodStart, periodEnd } | { programMemberId, isTest: true }
//
// Brand-only. Computes (or reuses) the payout for one creator's program
// membership over a billing period — video_count * pay_per_video_cents,
// capped at the program's video target — and returns a Stripe Checkout
// Session URL that funds escrow.
//
// With `isTest`, funds the program's flat one-time test payout instead: no
// period, no posted videos required, one per member.
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
    const { programMemberId, periodStart, periodEnd, isTest } =
      await request.json();
    if (!programMemberId) {
      return NextResponse.json(
        { error: "programMemberId is required" },
        { status: 400 },
      );
    }
    if (!isTest && (!periodStart || !periodEnd)) {
      return NextResponse.json(
        { error: "periodStart and periodEnd are required" },
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
         program:programs ( id, brand_id, title, pay_per_video_cents, videos_per_period, test_payout_amount_cents )`,
      )
      .eq("id", programMemberId)
      .maybeSingle();
    if (memErr) throw memErr;
    if (!member) {
      return NextResponse.json({ error: "Campaign member not found." }, { status: 404 });
    }

    const program = member.program;
    if (!program || program.brand_id !== user.id) {
      return NextResponse.json(
        { error: "Only the brand can fund this payout." },
        { status: 403 },
      );
    }

    let billableVideos = 0;
    let amountCents = 0;
    let retryTestPayoutId = null;

    if (isTest) {
      amountCents = program.test_payout_amount_cents || 0;
      if (amountCents <= 0) {
        return NextResponse.json(
          { error: "This campaign doesn't offer a test payout." },
          { status: 400 },
        );
      }

      const { data: existingTest } = await admin
        .from("program_payouts")
        .select("id, status")
        .eq("program_member_id", programMemberId)
        .eq("payout_type", "test")
        .maybeSingle();
      if (existingTest && existingTest.status !== "failed") {
        return NextResponse.json(
          { error: "This creator's test payout has already been funded." },
          { status: 400 },
        );
      }
      // A previous checkout that expired or failed can be retried in place.
      retryTestPayoutId = existingTest?.id || null;
    } else {
      const { count: videoCount } = await admin
        .from("program_videos")
        .select("id", { count: "exact", head: true })
        .eq("program_member_id", programMemberId)
        .gte("posted_at", periodStart)
        .lt("posted_at", periodEnd);

      billableVideos = Math.min(videoCount || 0, program.videos_per_period);
      amountCents = billableVideos * program.pay_per_video_cents;
      if (amountCents <= 0) {
        return NextResponse.json(
          { error: "No billable videos posted in this period yet." },
          { status: 400 },
        );
      }
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

    const payoutRow = {
      program_member_id: programMemberId,
      program_id: program.id,
      brand_id: program.brand_id,
      creator_id: member.creator_id,
      payout_type: isTest ? "test" : "period",
      period_start: isTest ? null : periodStart,
      period_end: isTest ? null : periodEnd,
      video_count: billableVideos,
      amount_cents: breakdown.amountCents,
      platform_fee_cents: breakdown.platformFeeCents,
      creator_payout_cents: breakdown.creatorPayoutCents,
      brand_stripe_account_id: brandStripeAccountId,
      status: "pending",
    };

    // Test payouts have null periods, so the (member, period) upsert target
    // doesn't apply — reuse a previously failed row, or insert a fresh one.
    const { data: payout, error: payoutErr } = isTest
      ? retryTestPayoutId
        ? await admin
            .from("program_payouts")
            .update(payoutRow)
            .eq("id", retryTestPayoutId)
            .select()
            .single()
        : await admin.from("program_payouts").insert(payoutRow).select().single()
      : await admin
          .from("program_payouts")
          .upsert(payoutRow, {
            onConflict: "program_member_id,period_start,period_end",
          })
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
      payout_type: isTest ? "test" : "period",
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
            name: isTest
              ? `${program.title || "Campaign"} — test video payout`
              : `${program.title || "Campaign"} — ${billableVideos} video${billableVideos !== 1 ? "s" : ""}`,
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
