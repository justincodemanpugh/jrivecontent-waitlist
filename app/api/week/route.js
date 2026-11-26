// The brand's "This week" page. Paying brands only.
//
//   GET                    → the week, what to copy, and the numbers
//   POST { task, done }    → tick or untick a task
//   POST { restart: true } → start the week again
import { NextResponse } from "next/server";
import { requirePaid } from "@/lib/billing/requirePaid";
import { loadCards } from "@/lib/board/load";
import { latestPlan, stillAvailable } from "@/lib/plan/stored";
import { videoIsEligible } from "@/lib/earnings/videoEarnings";
import { isTaskKey, weekDay, weekOver } from "@/lib/week/progress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function failure(e) {
  console.error("[week]", e);
  return NextResponse.json({ error: "We couldn't load your week. Try again in a minute." }, { status: 500 });
}

// Every synced video is listed, including ones not about the app, so only
// approved ones count towards views.
async function videoNumbers(admin, brandId) {
  const { data, error } = await admin
    .from("program_videos")
    .select(
      "views, review_status, posted_at, program_members!inner ( joined_at, programs!inner ( brand_id, ledger_started_at ) )",
    )
    .eq("program_members.programs.brand_id", brandId);
  if (error) throw error;

  const rows = data || [];
  const approved = rows.filter((v) => v.review_status === "approved");
  return {
    videos: approved.length,
    views: approved.reduce((sum, v) => sum + (Number(v.views) || 0), 0),
    toReview: rows.filter(
      (v) =>
        (v.review_status === "pending" || v.review_status === "flagged") &&
        videoIsEligible(v, v.program_members, v.program_members.programs),
    ).length,
  };
}

async function moneyNumbers(admin, brandId) {
  const [paying, owed, integration] = await Promise.all([
    admin.from("revenue_attributions").select("first_purchase_at").eq("brand_id", brandId),
    admin.from("creator_earnings").select("amount_cents, status").eq("brand_id", brandId).in("status", ["held", "payable"]),
    admin.from("brand_integrations").select("status").eq("brand_id", brandId).eq("provider", "revenuecat").maybeSingle(),
  ]);
  for (const r of [paying, owed, integration]) if (r.error) throw r.error;
  return {
    // Null: we can't know who paid without RevenueCat.
    paying:
      integration.data?.status === "connected"
        ? paying.data.filter((a) => a.first_purchase_at).length
        : null,
    owedCents: owed.data.reduce((sum, e) => sum + e.amount_cents, 0),
  };
}

export async function GET() {
  try {
    const { response, user, admin } = await requirePaid();
    if (response) return response;

    const row = await latestPlan(admin, user.id);
    if (!row) return NextResponse.json({ saved: false });

    let startedAt = row.week_started_at;
    if (!startedAt) {
      startedAt = new Date().toISOString();
      const { error } = await admin.from("brand_plans").update({ week_started_at: startedAt }).eq("id", row.id);
      if (error) throw error;
    }

    const [plan, cards, videos, money] = await Promise.all([
      stillAvailable(admin, row.plan),
      loadCards(admin, user.id, row),
      videoNumbers(admin, user.id),
      moneyNumbers(admin, user.id),
    ]);

    return NextResponse.json({
      saved: true,
      appName: plan.appName,
      goalLabel: plan.goalLabel,
      day: weekDay(startedAt),
      over: weekOver(startedAt),
      week: plan.week,
      done: row.done_tasks || [],
      message: plan.message,
      brief: plan.brief,
      videos: plan.videos.map((v) => ({ url: v.video_url, views: v.views, caption: v.caption })),
      numbers: {
        messaged: cards.filter((c) => c.status !== "to_message").length,
        toMessage: cards.filter((c) => c.status === "to_message").length,
        ...videos,
        ...money,
      },
    });
  } catch (e) {
    return failure(e);
  }
}

export async function POST(request) {
  try {
    const { response, user, admin } = await requirePaid();
    if (response) {
      return response.status === 401
        ? response
        : NextResponse.json({ error: "Subscribe to use your plan." }, { status: 402 });
    }

    const row = await latestPlan(admin, user.id);
    if (!row) return NextResponse.json({ error: "Make a plan first." }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    let patch;
    if (body.restart === true) {
      patch = { done_tasks: [], week_started_at: new Date().toISOString() };
    } else if (typeof body.done === "boolean" && isTaskKey(row.plan.week, body.task)) {
      const others = (row.done_tasks || []).filter((k) => k !== body.task);
      patch = { done_tasks: body.done ? [...others, body.task] : others };
    } else {
      return NextResponse.json({ error: "Unknown task." }, { status: 400 });
    }

    const { error } = await admin.from("brand_plans").update(patch).eq("id", row.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
