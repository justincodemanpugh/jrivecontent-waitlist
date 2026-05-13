// GET /api/stripe/earnings
// Creator-only. Returns the creator's released earnings totals (this month
// and lifetime) in dollars, computed from our `payments` table. We use our
// DB rather than Stripe's balance API so the number is consistent with
// what we've actually released, and so it includes amounts already paid
// out to the creator's bank.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("payments")
      .select("creator_payout_cents, released_at, status, videos_paid_out, total_videos_requested")
      .eq("creator_id", user.id)
      .in("status", ["released", "escrowed"])
      .not("released_at", "is", null);

    if (error) {
      console.error("[stripe/earnings] query error:", error);
      return NextResponse.json(
        { earningsThisMonth: 0, earningsTotal: 0 },
        { status: 200 },
      );
    }

    let monthCents = 0;
    let totalCents = 0;
    for (const row of data || []) {
      // Pro-rate per-video payouts when not all videos in a payment have
      // been released yet (matches the multi-video release logic).
      const total = row.total_videos_requested || 1;
      const paid = row.videos_paid_out || total;
      const fraction = total > 0 ? paid / total : 1;
      const earned = Math.round((row.creator_payout_cents || 0) * fraction);
      totalCents += earned;
      if (row.released_at && new Date(row.released_at) >= startOfMonth) {
        monthCents += earned;
      }
    }

    return NextResponse.json({
      earningsThisMonth: monthCents / 100,
      earningsTotal: totalCents / 100,
    });
  } catch (e) {
    console.error("[stripe/earnings]", e);
    return NextResponse.json(
      { error: e.message || "Failed to load earnings." },
      { status: 500 },
    );
  }
}
