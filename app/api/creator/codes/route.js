// GET /api/creator/codes
//
// Creator-only. Returns { codes: { [brandId]: "CODE" } } for every brand
// whose rev-share campaign the creator is in (invited or active), creating
// missing codes. The creator says this code in their videos; the brand's app
// stores it in RevenueCat (see lib/earnings/revenuecat.js).
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureCreatorCode } from "@/lib/earnings/codes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const admin = createAdminClient();
  const { data: memberships, error } = await admin
    .from("program_members")
    .select("status, programs!inner ( brand_id, revshare_bps, status )")
    .eq("creator_id", user.id)
    .in("status", ["invited", "active"])
    .gt("programs.revshare_bps", 0);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const brandIds = [
    ...new Set(
      (memberships || [])
        .filter((m) => m.programs?.status !== "archived")
        .map((m) => m.programs.brand_id),
    ),
  ];
  const codes = {};
  for (const brandId of brandIds) {
    codes[brandId] = await ensureCreatorCode(admin, { brandId, creatorId: user.id });
  }
  return NextResponse.json({ codes });
}
