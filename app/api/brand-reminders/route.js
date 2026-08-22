// GET|POST /api/brand-reminders
// Cron-triggered endpoint that sends reminder emails to brands who
// completed onboarding but haven't posted a gig yet.
//
// Vercel Cron invokes with GET and an `Authorization: Bearer <CRON_SECRET>`
// header; POST with `x-cron-secret` is supported for manual runs.
//
// Supports multiple reminder tiers:
//   - no_gig_3_days:  3 days after onboarding
//   - no_gig_7_days:  7 days after onboarding
//   - no_gig_14_days: 14 days after onboarding

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.jrivecontent.com";

const REMINDER_TIERS = [
  { type: "no_gig_3_days", daysAfterOnboarding: 3 },
  { type: "no_gig_7_days", daysAfterOnboarding: 7 },
  { type: "no_gig_14_days", daysAfterOnboarding: 14 },
];

function buildReminderEmail(brandName, reminderType) {
  const name = brandName || "there";
  const dashboardLink = `${SITE_URL}/dashboard/brand/gigs/new`;

  const templates = {
    no_gig_3_days: {
      subject: "Ready to post your first gig?",
      heading: "Your creator marketplace awaits",
      intro: `Hi ${name}, you signed up for JriveContent a few days ago but haven't posted a gig yet. Posting takes just 2 minutes and gets your brand in front of talented creators immediately.`,
      cta: "Post your first gig",
    },
    no_gig_7_days: {
      subject: "Creators are waiting for brands like yours",
      heading: "Don't miss out on great creators",
      intro: `Hi ${name}, it's been a week since you joined JriveContent. Our creators are actively looking for brands to work with — post a gig and start receiving applications today.`,
      cta: "Create a gig now",
    },
    no_gig_14_days: {
      subject: "Last chance: Your JriveContent account",
      heading: "We'd love to see you succeed",
      intro: `Hi ${name}, we noticed you haven't posted a gig yet. If you're unsure where to start, reply to this email — we're happy to help you craft the perfect brief.`,
      cta: "Post a gig",
    },
  };

  const tmpl = templates[reminderType] || templates.no_gig_3_days;
  return { ...tmpl, link: dashboardLink };
}

function renderHtml({ heading, intro, cta, link }) {
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
              <p style="font-size:15px;line-height:1.6;color:#bbb;margin:0 0 28px;">${intro}</p>
              <a href="${link}" style="display:inline-block;background:#fff;color:#000;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:15px;">${cta}</a>
              <p style="font-size:12px;line-height:1.6;color:#666;margin:32px 0 0;">Or paste this link into your browser:<br/><a href="${link}" style="color:#888;">${link}</a></p>
            </td></tr>
          </table>
          <div style="max-width:560px;font-size:12px;color:#555;margin-top:16px;text-align:center;">
            You're receiving this because you have a brand account at <a href="${SITE_URL}" style="color:#777;">jrivecontent.com</a>.
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderText({ heading, intro, cta, link }) {
  return `${heading}\n\n${intro}\n\n${cta}: ${link}\n`;
}

async function handler(request) {
  // 1. Auth: only cron jobs with the shared secret can trigger this.
  // Accepts either x-cron-secret header (manual trigger) or Vercel's
  // CRON_SECRET via Authorization header (Vercel Cron Jobs).
  const secret = process.env.CRON_SECRET;
  const providedHeader = request.headers.get("x-cron-secret");
  const authHeader = request.headers.get("authorization");
  const providedAuth = authHeader?.replace("Bearer ", "");
  
  if (!secret || (providedHeader !== secret && providedAuth !== secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Resend config sanity check.
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    console.error("[brand-reminders] missing RESEND_API_KEY or RESEND_FROM_EMAIL");
    return NextResponse.json({ error: "Email not configured" }, { status: 500 });
  }

  const admin = createAdminClient();
  const resend = new Resend(apiKey);
  const results = { sent: [], skipped: [], errors: [] };

  // 3. Process each reminder tier.
  for (const tier of REMINDER_TIERS) {
    const cutoffDate = new Date(
      Date.now() - tier.daysAfterOnboarding * 24 * 60 * 60 * 1000
    ).toISOString();

    // Find brands who:
    // - Completed onboarding before the cutoff
    // - Have NOT posted any gigs
    // - Have NOT received this reminder type yet
    const { data: eligibleBrands, error: queryErr } = await admin.rpc(
      "get_brands_needing_gig_reminder",
      {
        reminder_type_param: tier.type,
        onboarded_before: cutoffDate,
      }
    );

    // If the RPC doesn't exist yet, fall back to a manual query
    let brands = eligibleBrands;
    if (queryErr) {
      console.log(`[brand-reminders] RPC not found, using fallback query for ${tier.type}`);
      
      // Get brands who onboarded before cutoff
      const { data: allBrands } = await admin
        .from("brand_profiles")
        .select("user_id, brand_name, onboarded_at")
        .not("onboarded_at", "is", null)
        .lt("onboarded_at", cutoffDate);

      if (!allBrands || allBrands.length === 0) {
        continue;
      }

      // Filter out brands who have gigs
      const brandIds = allBrands.map((b) => b.user_id);
      const { data: brandsWithGigs } = await admin
        .from("gigs")
        .select("brand_id")
        .in("brand_id", brandIds)
        .is("deleted_at", null);

      const brandsWithGigsSet = new Set(
        (brandsWithGigs || []).map((g) => g.brand_id)
      );

      // Filter out brands who already received this reminder
      const { data: alreadySent } = await admin
        .from("brand_reminder_emails")
        .select("user_id")
        .in("user_id", brandIds)
        .eq("reminder_type", tier.type);

      const alreadySentSet = new Set(
        (alreadySent || []).map((r) => r.user_id)
      );

      brands = allBrands.filter(
        (b) => !brandsWithGigsSet.has(b.user_id) && !alreadySentSet.has(b.user_id)
      );
    }

    if (!brands || brands.length === 0) {
      continue;
    }

    // 4. Send emails to eligible brands.
    for (const brand of brands) {
      try {
        // Look up email from auth.users
        const { data: userRes, error: userErr } = await admin.auth.admin.getUserById(
          brand.user_id
        );
        if (userErr || !userRes?.user?.email) {
          results.skipped.push({
            user_id: brand.user_id,
            reason: "no email on file",
          });
          continue;
        }

        const email = userRes.user.email;
        const tmpl = buildReminderEmail(brand.brand_name, tier.type);
        const html = renderHtml(tmpl);
        const text = renderText(tmpl);

        const { data: sendData, error: sendErr } = await resend.emails.send({
          from: fromEmail,
          to: email,
          subject: tmpl.subject,
          html,
          text,
        });

        if (sendErr) throw sendErr;

        // Record that we sent this reminder
        await admin.from("brand_reminder_emails").insert({
          user_id: brand.user_id,
          reminder_type: tier.type,
          resend_id: sendData?.id || null,
          metadata: { brand_name: brand.brand_name },
        });

        results.sent.push({
          user_id: brand.user_id,
          reminder_type: tier.type,
          resend_id: sendData?.id,
        });
      } catch (err) {
        console.error(`[brand-reminders] failed to send to ${brand.user_id}`, err);
        results.errors.push({
          user_id: brand.user_id,
          error: err.message,
        });
      }
    }
  }

  return NextResponse.json({
    ok: true,
    sent: results.sent.length,
    skipped: results.skipped.length,
    errors: results.errors.length,
    details: results,
  });
}

export const GET = handler;
export const POST = handler;
