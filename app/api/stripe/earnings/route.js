// GET /api/stripe/earnings
// Creator-only. Returns the creator's program payout totals in dollars:
// money already released (this month + lifetime) and money funded by the
// brand but not yet transferred. Computed from our `program_payouts` table
// rather than Stripe's balance API so the numbers match what we've recorded
// and include amounts already paid out to the creator's bank.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const EMPTY = { earningsThisMonth: 0, earningsTotal: 0, pendingToReceive: 0 };

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
      .from("program_payouts")
      .select("creator_payout_cents, released_at, status")
      .eq("creator_id", user.id)
      .in("status", ["released", "escrowed", "released_pending"]);

    if (error) {
      console.error("[stripe/earnings] query error:", error);
      return NextResponse.json(EMPTY, { status: 200 });
    }

    let monthCents = 0;
    let totalCents = 0;
    let pendingCents = 0;
    for (const row of data || []) {
      const cents = row.creator_payout_cents || 0;
      if (row.status === "released") {
        totalCents += cents;
        if (row.released_at && new Date(row.released_at) >= startOfMonth) {
          monthCents += cents;
        }
      } else {
        pendingCents += cents;
      }
    }

    return NextResponse.json({
      earningsThisMonth: monthCents / 100,
      earningsTotal: totalCents / 100,
      pendingToReceive: pendingCents / 100,
    });
  } catch (e) {
    console.error("[stripe/earnings]", e);
    return NextResponse.json(
      { error: e.message || "Failed to load earnings." },
      { status: 500 },
    );
  }
}
