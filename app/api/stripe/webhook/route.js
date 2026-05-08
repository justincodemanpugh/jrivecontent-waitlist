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
        if (!paymentId || !conversationId) break;

        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;

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

        // Drop a system message in the thread.
        await admin.from("messages").insert({
          conversation_id: conversationId,
          sender_id: session.metadata?.brand_id,
          body: "Brand deposited the gig amount — funds held in escrow.",
          kind: "system",
        });
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
