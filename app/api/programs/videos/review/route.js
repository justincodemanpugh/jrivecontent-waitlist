// POST /api/programs/videos/review
// Body: { videoId, decision: "approve" | "reject" }
//
// Brand-only. Approving a video earns its base pay right away (CPM follows
// on the daily accrual). Rejecting reverses anything it already earned that
// hasn't been paid; already-paid amounts are netted from the creator's next
// payout. Goes through the service role so brands can only change review
// columns, never metrics.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PROGRAM_COLUMNS,
  accrueBaseForVideo,
  accrueCpmForVideo,
  restoreVideoEarnings,
  reverseVideoEarnings,
} from "@/lib/earnings/videoEarnings";
import { BRAND_VOUCHED, looksSuspicious } from "@/lib/earnings/calc";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { videoId, decision } = await request.json();
    if (!videoId || !["approve", "reject"].includes(decision)) {
      return NextResponse.json({ error: "videoId and decision required" }, { status: 400 });
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

    const admin = createAdminClient();
    const { data: video } = await admin
      .from("program_videos")
      .select(
        `id, posted_at, views, likes, review_status, reviewed_at,
         program_members!inner ( id, creator_id, status, joined_at,
           programs!inner ( ${PROGRAM_COLUMNS} ) )`,
      )
      .eq("id", videoId)
      .maybeSingle();
    if (!video) return NextResponse.json({ error: "Video not found." }, { status: 404 });

    const member = video.program_members;
    const program = member.programs;
    if (program.brand_id !== user.id) {
      return NextResponse.json({ error: "Only the campaign's brand can review." }, { status: 403 });
    }

    const reviewStatus = decision === "approve" ? "approved" : "rejected";
    const { error: updateErr } = await admin
      .from("program_videos")
      .update({
        review_status: reviewStatus,
        reviewed_at: new Date().toISOString(),
        flagged_reason: decision === "approve" && looksSuspicious(video) ? BRAND_VOUCHED : null,
      })
      .eq("id", videoId);
    if (updateErr) throw updateErr;

    if (decision === "reject") {
      const result = await reverseVideoEarnings(admin, videoId, "rejected_by_brand");
      return NextResponse.json({ ok: true, reviewStatus, ...result });
    }

    await restoreVideoEarnings(admin, videoId);
    const reviewed = { ...video, review_status: "approved" };
    const base = await accrueBaseForVideo(admin, { program, member, video: reviewed });
    const cpm = await accrueCpmForVideo(admin, { program, member, video: reviewed });
    return NextResponse.json({
      ok: true,
      reviewStatus,
      baseEarnedCents: base.amountCents || 0,
      cpmEarnedCents: cpm.amountCents || 0,
    });
  } catch (e) {
    console.error("[programs/videos/review]", e);
    return NextResponse.json({ error: e.message || "Review failed." }, { status: 500 });
  }
}
