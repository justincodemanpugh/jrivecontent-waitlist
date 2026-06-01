// POST /api/notifications/email
// Supabase Database Webhook receiver. Fires on INSERT into public.notifications
// and sends the recipient a transactional email via Resend.
//
// Configure in Supabase: Database → Webhooks → new hook on `notifications`
// table, INSERT only, POST to this URL, with header `x-webhook-secret` set
// to SUPABASE_WEBHOOK_SECRET.

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.jrivecontent.com";

// Renders the HTML body for a given notification type.
// `notification` is the row inserted into public.notifications.
function buildEmail(notification, recipientName) {
  const link = notification.link_url
    ? `${SITE_URL}${notification.link_url}`
    : SITE_URL;
  const greeting = recipientName ? `Hi ${recipientName},` : "Hi,";

  switch (notification.type) {
    case "application_new":
      return {
        subject: `New applicant: ${notification.body || "someone applied to your gig"}`,
        heading: "You have a new applicant",
        intro: notification.body || "A creator just applied to your gig.",
        cta: "Review applicant",
        link,
      };
    case "application_accepted":
      return {
        subject: "You were accepted for a gig",
        heading: "Congrats — you got the gig",
        intro:
          notification.body ||
          "Your application was accepted. Open the dashboard to kick things off.",
        cta: "Open dashboard",
        link,
      };
    case "application_declined":
      return {
        subject: "Update on your gig application",
        heading: "Application update",
        intro:
          notification.body ||
          "Your application was declined. Plenty more gigs to apply to.",
        cta: "Browse gigs",
        link,
      };
    case "message_new":
      return {
        subject: notification.title || "You have a new message",
        heading: "New message",
        intro: notification.body || "You have a new message on jrivecontent.",
        cta: "Open conversation",
        link,
      };
    case "gig_new":
      return {
        subject: `New gig: ${notification.title || "A brand is looking for creators"}`,
        heading: "New gig posted",
        intro: notification.body || "A brand just posted a new gig that might be perfect for you.",
        cta: "View gig",
        link,
      };
    default:
      // Generic fallback so future notification types still get an email
      // without code changes.
      return {
        subject: notification.title || "You have a new notification",
        heading: notification.title || "New notification",
        intro: notification.body || "Open jrivecontent to see what's new.",
        cta: "Open jrivecontent",
        link,
      };
  }
}

function renderHtml({ greeting, heading, intro, cta, link }) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e5e5e5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#111;border:1px solid #222;border-radius:12px;padding:32px;">
            <tr><td>
              <div style="font-size:14px;color:#888;margin-bottom:24px;">jrivecontent</div>
              <h1 style="font-size:22px;font-weight:600;color:#fff;margin:0 0 16px;">${heading}</h1>
              <p style="font-size:15px;line-height:1.6;color:#bbb;margin:0 0 8px;">${greeting}</p>
              <p style="font-size:15px;line-height:1.6;color:#bbb;margin:0 0 28px;">${intro}</p>
              <a href="${link}" style="display:inline-block;background:#fff;color:#000;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:15px;">${cta}</a>
              <p style="font-size:12px;line-height:1.6;color:#666;margin:32px 0 0;">Or paste this link into your browser:<br/><a href="${link}" style="color:#888;">${link}</a></p>
            </td></tr>
          </table>
          <div style="max-width:560px;font-size:12px;color:#555;margin-top:16px;text-align:center;">
            You're receiving this because you have an account at <a href="${SITE_URL}" style="color:#777;">jrivecontent.com</a>.
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderText({ greeting, heading, intro, cta, link }) {
  return `${heading}\n\n${greeting}\n\n${intro}\n\n${cta}: ${link}\n`;
}

export async function POST(request) {
  // 1. Auth: only Supabase (with the shared secret) can trigger this.
  const secret = process.env.SUPABASE_WEBHOOK_SECRET;
  const provided = request.headers.get("x-webhook-secret");
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Resend config sanity check.
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    console.error("[notifications/email] missing RESEND_API_KEY or RESEND_FROM_EMAIL");
    return NextResponse.json({ error: "Email not configured" }, { status: 500 });
  }

  // 3. Parse Supabase webhook payload.
  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload?.type !== "INSERT" || payload?.table !== "notifications") {
    // Webhook misconfigured or duplicate trigger — ack without sending.
    return NextResponse.json({ ok: true, skipped: "not an insert on notifications" });
  }

  const notification = payload.record;
  if (!notification?.user_id || !notification?.type) {
    return NextResponse.json({ ok: true, skipped: "missing fields" });
  }

  const admin = createAdminClient();

  // 4. Look up recipient's email + display name.
  let email = null;
  let displayName = null;
  try {
    const { data: userRes, error: userErr } = await admin.auth.admin.getUserById(
      notification.user_id,
    );
    if (userErr) throw userErr;
    email = userRes?.user?.email || null;
  } catch (err) {
    console.error("[notifications/email] failed to look up user", err);
    return NextResponse.json({ error: "User lookup failed" }, { status: 500 });
  }

  if (!email) {
    return NextResponse.json({ ok: true, skipped: "no email on file" });
  }

  // Best-effort name lookup from whichever profile table has a row.
  try {
    const [{ data: creator }, { data: brand }] = await Promise.all([
      admin
        .from("creator_profiles")
        .select("display_name, handle")
        .eq("user_id", notification.user_id)
        .maybeSingle(),
      admin
        .from("brand_profiles")
        .select("brand_name")
        .eq("user_id", notification.user_id)
        .maybeSingle(),
    ]);
    displayName =
      creator?.display_name ||
      creator?.handle ||
      brand?.brand_name ||
      null;
  } catch {
    // Name is optional — fall through with null.
  }

  // 5. Build + send.
  const tmpl = buildEmail(notification, displayName);
  const greeting = displayName ? `Hi ${displayName},` : "Hi,";
  const html = renderHtml({ greeting, ...tmpl });
  const text = renderText({ greeting, ...tmpl });

  const resend = new Resend(apiKey);
  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: tmpl.subject,
      html,
      text,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true, id: data?.id || null });
  } catch (err) {
    console.error("[notifications/email] resend send failed", err);
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }
}

// Optional GET so you can hit the URL in a browser and confirm the route
// deployed (returns 405, not 404).
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
