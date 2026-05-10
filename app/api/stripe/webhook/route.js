// POST /api/stripe/webhook
// Stripe webhook receiver. Verifies signature, then on a successful
// checkout it flips the payment row to 'escrowed' and conversation
// .payment_deposited = true.
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

// IMPORTANT: Stripe needs the raw request body to verify the signature,
// so we must opt out of body parsing here.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const sig = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: "Missing signature or secret." }, { status: 400 });
  }

  let event;
  try {
    const raw = await request.text();
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    console.error("[stripe/webhook] signature verification failed", err.message);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const paymentId = session.metadata?.payment_id;
        const conversationId = session.metadata?.conversation_id;
        const kind = session.metadata?.kind || "initial";
        const videosInThisCheckout = Math.max(
          1,
          Number(session.metadata?.videos || 1),
        );
        if (!paymentId || !conversationId) break;

        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;

        if (kind === "additional") {
          // Top up: add this checkout's amounts onto the existing payment row
          // and increment total_videos_requested on the conversation.
          const { data: existing } = await admin
            .from("payments")
            .select(
              "amount_cents, platform_fee_cents, creator_payout_cents, status",
            )
            .eq("id", paymentId)
            .maybeSingle();

          const amountTotal = Number(session.amount_total || 0);
          const platformFee = Math.round(amountTotal * 0.15);
          const creatorPayout = amountTotal - platformFee;

          await admin
            .from("payments")
            .update({
              amount_cents: (existing?.amount_cents || 0) + amountTotal,
              platform_fee_cents:
                (existing?.platform_fee_cents || 0) + platformFee,
              creator_payout_cents:
                (existing?.creator_payout_cents || 0) + creatorPayout,
              // If we'd already released everything, status moves back to
              // escrowed because there's now new escrow waiting.
              status: "escrowed",
              stripe_payment_intent_id:
                paymentIntentId || existing?.stripe_payment_intent_id || null,
            })
            .eq("id", paymentId);

          // Bump the requested video count by how many they just paid for.
          const { data: convRow } = await admin
            .from("conversations")
            .select("total_videos_requested")
            .eq("id", conversationId)
            .maybeSingle();
          await admin
            .from("conversations")
            .update({
              total_videos_requested:
                (convRow?.total_videos_requested || 0) + videosInThisCheckout,
            })
            .eq("id", conversationId);

          await admin.from("messages").insert({
            conversation_id: conversationId,
            sender_id: session.metadata?.brand_id,
            body: `Brand deposited for ${videosInThisCheckout} additional video${
              videosInThisCheckout > 1 ? "s" : ""
            } — added to escrow.`,
            kind: "system",
          });
        } else {
          // Initial deposit.
          await admin
            .from("payments")
            .update({
              status: "escrowed",
              stripe_payment_intent_id: paymentIntentId || null,
              deposited_at: new Date().toISOString(),
            })
            .eq("id", paymentId);

          await admin
            .from("conversations")
            .update({ payment_deposited: true })
            .eq("id", conversationId);

          await admin.from("messages").insert({
            conversation_id: conversationId,
            sender_id: session.metadata?.brand_id,
            body: `Brand deposited for ${videosInThisCheckout} video${
              videosInThisCheckout > 1 ? "s" : ""
            } — funds held in escrow.`,
            kind: "system",
          });
        }
        break;
      }

      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = event.data.object;
        const paymentId = session.metadata?.payment_id;
        if (paymentId) {
          await admin
            .from("payments")
            .update({ status: "failed" })
            .eq("id", paymentId)
            .eq("status", "pending");
        }
        break;
      }

      case "account.updated": {
        // Connect account onboarding completion.
        const acct = event.data.object;
        if (acct?.id) {
          await admin
            .from("creator_profiles")
            .update({ stripe_payouts_enabled: !!acct.payouts_enabled })
            .eq("stripe_account_id", acct.id);
        }
        break;
      }

      default:
        // ignore everything else
        break;
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[stripe/webhook] handler error", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
