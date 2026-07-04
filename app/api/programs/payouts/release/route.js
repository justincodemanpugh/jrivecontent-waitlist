// POST /api/programs/payouts/release
// Body: { payoutId }
//
// Brand-only. Transfers the creator's share of an escrowed program payout
// from the brand's Connect balance to the creator's Connect account.
// Mirrors /api/briefs/escrow/release.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe, getAccountCurrency } from "@/lib/stripe/server";

export async function POST(request) {
  try {
    const { payoutId } = await request.json();
    if (!payoutId) {
      return NextResponse.json({ error: "payoutId required" }, { status: 400 });
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: payout, error: payoutErr } = await admin
      .from("program_payouts")
      .select("*")
      .eq("id", payoutId)
      .maybeSingle();
    if (payoutErr) throw payoutErr;
    if (!payout) {
      return NextResponse.json({ error: "Payout not found." }, { status: 404 });
    }
    if (payout.brand_id !== user.id) {
      return NextResponse.json({ error: "Only the brand can release." }, { status: 403 });
    }
    if (payout.status === "pending") {
      return NextResponse.json(
        { error: "Payout hasn't been funded yet." },
        { status: 400 },
      );
    }
    if (payout.status === "released") {
      return NextResponse.json({ ok: true, alreadyReleased: true });
    }

    const shareCents = Number(payout.creator_payout_cents || 0);
    if (shareCents <= 0) {
      return NextResponse.json({ error: "Nothing to release." }, { status: 400 });
    }

    const { data: creator } = await admin
      .from("creator_profiles")
      .select("stripe_account_id, stripe_payouts_enabled")
      .eq("user_id", payout.creator_id)
      .maybeSingle();

    if (!creator?.stripe_account_id || !creator?.stripe_payouts_enabled) {
      await admin
        .from("program_payouts")
        .update({ status: "released_pending" })
        .eq("id", payout.id);
      return NextResponse.json({ ok: true, pendingCreatorOnboarding: true });
    }

    const transferCurrency = await getAccountCurrency();
    const brandAccountId = payout.brand_stripe_account_id || null;

    const transferParams = {
      amount: shareCents,
      currency: transferCurrency,
      destination: creator.stripe_account_id,
      metadata: {
        program_payout_id: payout.id,
        program_member_id: payout.program_member_id,
        program_id: payout.program_id,
      },
    };

    const transfer = brandAccountId
      ? await stripe.transfers.create(transferParams, {
          stripeAccount: brandAccountId,
        })
      : await stripe.transfers.create(transferParams);

    await admin
      .from("program_payouts")
      .update({
        status: "released",
        stripe_transfer_id: transfer.id,
        released_at: new Date().toISOString(),
      })
      .eq("id", payout.id);

    return NextResponse.json({ ok: true, transferId: transfer.id });
  } catch (e) {
    console.error("[programs/payouts/release]", e);
    return NextResponse.json({ error: e.message || "Release failed." }, { status: 500 });
  }
}
