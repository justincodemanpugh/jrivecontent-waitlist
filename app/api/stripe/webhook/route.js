// POST /api/stripe/webhook
// Stripe webhook receiver. Verifies signature, then routes each event to the
// program payout, legacy brief escrow, subscription, or Connect account handler.
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

        // --- Program payout deposits ---
        if (session.metadata?.kind === "program_payout") {
          const programPayoutId = session.metadata?.program_payout_id;
          if (!programPayoutId) break;

          const payoutIntentId =
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id;

          await admin
            .from("program_payouts")
            .update({
              status: "escrowed",
              stripe_payment_intent_id: payoutIntentId || null,
              deposited_at: new Date().toISOString(),
            })
            .eq("id", programPayoutId);

          break;
        }

        // --- Brief escrow deposits (separate from gig/conversation flow) ---
        if (session.metadata?.kind === "brief") {
          const briefPaymentId = session.metadata?.brief_payment_id;
          const briefRecipientId = session.metadata?.brief_recipient_id;
          if (!briefPaymentId || !briefRecipientId) break;

          const briefIntentId =
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id;

          await admin
            .from("brief_payments")
            .update({
              status: "escrowed",
              stripe_payment_intent_id: briefIntentId || null,
              deposited_at: new Date().toISOString(),
            })
            .eq("id", briefPaymentId);

          await admin
            .from("brief_recipients")
            .update({ escrow_status: "escrowed" })
            .eq("id", briefRecipientId);

          break;
        }

        break;
      }

      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = event.data.object;

        if (session.metadata?.kind === "program_payout") {
          const programPayoutId = session.metadata?.program_payout_id;
          if (programPayoutId) {
            await admin
              .from("program_payouts")
              .update({ status: "failed" })
              .eq("id", programPayoutId)
              .eq("status", "pending");
          }
          break;
        }

        if (session.metadata?.kind === "brief") {
          const briefPaymentId = session.metadata?.brief_payment_id;
          const briefRecipientId = session.metadata?.brief_recipient_id;
          if (briefPaymentId) {
            await admin
              .from("brief_payments")
              .update({ status: "failed" })
              .eq("id", briefPaymentId)
              .eq("status", "pending");
          }
          if (briefRecipientId) {
            await admin
              .from("brief_recipients")
              .update({ escrow_status: "none" })
              .eq("id", briefRecipientId)
              .eq("escrow_status", "pending");
          }
          break;
        }

        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        // Keep brand_profiles in sync with the brand's platform-subscription
        // ($25/mo) state so the Settings → Billing tab and any server-side
        // plan gates have a fast read path.
        const sub = event.data.object;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        // Only handle the brand platform subscription, identified by the
        // metadata we set when creating the Checkout session.
        const isBrandPlan =
          sub.metadata?.plan === "brand_monthly" ||
          // Fallback: match by price id in case metadata is missing.
          (sub.items?.data?.[0]?.price?.id &&
            sub.items.data[0].price.id ===
              process.env.STRIPE_BRAND_SUBSCRIPTION_PRICE_ID);
        if (!customerId || !isBrandPlan) break;

        const status =
          event.type === "customer.subscription.deleted"
            ? "canceled"
            : sub.status || "active";

        const priceId = sub.items?.data?.[0]?.price?.id || null;
        const currentPeriodEnd = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null;

        // Prefer matching on stripe_customer_id (saved at checkout time),
        // but fall back to the user_id stamped on the subscription metadata
        // in case the customer id wasn't persisted yet.
        const update = {
          stripe_customer_id: customerId,
          stripe_subscription_id:
            event.type === "customer.subscription.deleted" ? null : sub.id,
          subscription_status: status,
          subscription_price_id: priceId,
          subscription_current_period_end: currentPeriodEnd,
          subscription_cancel_at_period_end: !!sub.cancel_at_period_end,
        };

        const { data: byCustomer } = await admin
          .from("brand_profiles")
          .update(update)
          .eq("stripe_customer_id", customerId)
          .select("user_id");

        if (!byCustomer || byCustomer.length === 0) {
          const userId = sub.metadata?.user_id;
          if (userId) {
            await admin
              .from("brand_profiles")
              .update(update)
              .eq("user_id", userId);
          }
        }
        break;
      }

      case "account.updated": {
        // Connect account onboarding completion. The same event fires for
        // creator and brand connected accounts (they share the
        // `account.updated` channel) so we update whichever profile owns
        // the account id.
        const acct = event.data.object;
        if (acct?.id) {
          await admin
            .from("creator_profiles")
            .update({ stripe_payouts_enabled: !!acct.payouts_enabled })
            .eq("stripe_account_id", acct.id);

          await admin
            .from("brand_profiles")
            .update({
              stripe_payouts_enabled: !!acct.payouts_enabled,
              stripe_charges_enabled: !!acct.charges_enabled,
              stripe_details_submitted: !!acct.details_submitted,
            })
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
