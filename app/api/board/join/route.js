// POST /api/board/join { token } — a signed-in creator accepts an invite.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { acceptInvite } from "@/lib/board/invite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { state } = await acceptInvite(createAdminClient(), body?.token, user.id);
    if (state !== "joined") {
      return NextResponse.json({ error: "This invite can't be used." }, { status: 409 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[board/join]", e);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
