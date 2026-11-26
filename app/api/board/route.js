// The brand's creator columns. Paying brands only.
//
//   GET                                  → cards, campaigns, message
//   POST  { source: "manual", handle }   → add a creator by TikTok handle
//   POST  { source, ref }                → add one from Browse Creators
//   PATCH { id, status?, notes? }        → move, annotate or remove a card
import { NextResponse } from "next/server";
import { requirePaid } from "@/lib/billing/requirePaid";
import { siteUrl } from "@/lib/stripe/server";
import { isStatus, memberId, normalizeHandle } from "@/lib/board/cards";
import { loadCards } from "@/lib/board/load";
import { campaignDefaults } from "@/lib/board/terms";
import { latestPlan } from "@/lib/plan/stored";
import { payTermsLabel } from "@/lib/earnings/calc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const refuse = (status, error) => NextResponse.json({ error }, { status });

function failure(e) {
  console.error("[board]", e);
  return refuse(500, "Something went wrong. Try again in a minute.");
}

async function campaigns(admin, brandId) {
  const { data, error } = await admin
    .from("programs")
    .select(
      "id, title, status, pay_per_video_cents, cpm_cents, revshare_bps, created_at, program_members ( creator_id, status )",
    )
    .eq("brand_id", brandId)
    .neq("status", "archived")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function GET() {
  try {
    const { response, user, admin } = await requirePaid();
    if (response) return response;

    const planRow = await latestPlan(admin, user.id);
    const [cards, programs] = await Promise.all([
      loadCards(admin, user.id, planRow),
      campaigns(admin, user.id),
    ]);

    const membership = new Map();
    for (const p of programs) {
      for (const m of p.program_members || []) {
        if (m.status !== "removed") membership.set(m.creator_id, { title: p.title, status: m.status });
      }
    }

    return NextResponse.json({
      cards: cards.map((c) => {
        const member = memberId(c);
        return {
          id: c.id,
          name: c.name,
          handle: c.handle,
          status: c.status,
          notes: c.notes,
          memberId: member,
          campaign: (member && membership.get(member)) || null,
          inviteUrl: member ? null : `${siteUrl()}/join/${c.invite_token}`,
        };
      }),
      campaigns: programs
        .filter((p) => p.status === "active")
        .map((p) => ({
          id: p.id,
          title: p.title,
          pay: payTermsLabel({
            payPerVideoCents: p.pay_per_video_cents,
            cpmCents: p.cpm_cents,
            revshareBps: p.revshare_bps,
          }),
        })),
      message: planRow?.plan.message || null,
      defaults: planRow
        ? campaignDefaults({ appName: planRow.plan.appName, answers: planRow.answers })
        : null,
    });
  } catch (e) {
    return failure(e);
  }
}

// Name and handle come from our own records, never from the request.
async function lookup(admin, source, ref) {
  if (source === "platform") {
    const { data } = await admin
      .from("creator_profiles")
      .select("user_id, display_name, handle, tiktok_handle, onboarded_at")
      .eq("user_id", ref)
      .maybeSingle();
    if (!data?.onboarded_at) return null;
    return {
      creator_ref: data.user_id,
      name: data.display_name || data.handle || "Creator",
      handle: (data.tiktok_handle || "").replace(/^@/, ""),
    };
  }
  if (source === "directory") {
    const { data } = await admin
      .from("discovered_creators")
      .select("id, username, nickname, hidden")
      .eq("id", ref)
      .maybeSingle();
    if (!data || data.hidden) return null;
    return { creator_ref: data.id, name: data.nickname || data.username, handle: data.username };
  }
  return null;
}

export async function POST(request) {
  try {
    const { response, user, admin } = await requirePaid();
    if (response) {
      return response.status === 401 ? response : refuse(402, "Subscribe to use the creator board.");
    }

    const body = await request.json().catch(() => ({}));
    let card;
    if (body.source === "manual") {
      const handle = normalizeHandle(body.handle);
      if (!handle) return refuse(400, "That doesn't look like a TikTok handle.");
      card = { creator_ref: handle, name: `@${handle}`, handle };
    } else {
      card = await lookup(admin, body.source, String(body.ref || ""));
      if (!card) return refuse(404, "That creator isn't available.");
    }

    // Someone who joined through an invite already has a card.
    if (body.source === "platform") {
      const { data: joined } = await admin
        .from("brand_outreach")
        .select("id, status")
        .eq("brand_id", user.id)
        .eq("joined_creator_id", card.creator_ref)
        .maybeSingle();
      if (joined && joined.status !== "removed") return NextResponse.json({ ok: true });
    }

    const key = { brand_id: user.id, source: body.source, creator_ref: card.creator_ref };
    const { data: existing, error: readError } = await admin
      .from("brand_outreach")
      .select("id, status")
      .eq("brand_id", key.brand_id)
      .eq("source", key.source)
      .eq("creator_ref", key.creator_ref)
      .maybeSingle();
    if (readError) throw readError;

    // Already there: leave its column alone unless it had been removed.
    if (existing && existing.status !== "removed") return NextResponse.json({ ok: true });

    const { error } = await admin
      .from("brand_outreach")
      .upsert({ ...key, name: card.name, handle: card.handle, status: "to_message" }, {
        onConflict: "brand_id,source,creator_ref",
      });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}

export async function PATCH(request) {
  try {
    const { response, user, admin } = await requirePaid();
    if (response) {
      return response.status === 401 ? response : refuse(402, "Subscribe to use the creator board.");
    }

    const body = await request.json().catch(() => ({}));
    const patch = {};
    if (body.status !== undefined) {
      if (!isStatus(body.status)) return refuse(400, "Unknown column.");
      patch.status = body.status;
    }
    if (typeof body.notes === "string") patch.notes = body.notes.slice(0, 1000);
    if (!body.id || !Object.keys(patch).length) return refuse(400, "Nothing to change.");

    // The brand_id filter is the ownership check.
    const { data, error } = await admin
      .from("brand_outreach")
      .update(patch)
      .eq("id", String(body.id))
      .eq("brand_id", user.id)
      .select("id");
    if (error) throw error;
    if (!data?.length) return refuse(404, "That card is gone. Refresh the page.");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
