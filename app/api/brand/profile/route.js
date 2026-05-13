// PATCH /api/brand/profile
// Lets the signed-in brand update editable profile fields from the
// Settings → Profile tab. Email changes go through Supabase Auth (which
// fires its own confirmation email), everything else just writes to the
// brand_profiles row.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const EDITABLE_FIELDS = ["brand_name", "website", "industry", "avatar_url"];

export async function PATCH(request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    // Whitelist + lightly normalize.
    const update = {};
    for (const key of EDITABLE_FIELDS) {
      if (key in body) {
        const raw = body[key];
        update[key] =
          typeof raw === "string" ? raw.trim() || null : raw ?? null;
      }
    }

    if (Object.keys(update).length > 0) {
      const { error } = await supabase
        .from("brand_profiles")
        .update(update)
        .eq("user_id", user.id);
      if (error) throw error;
    }

    // Optional email change.
    if (typeof body.email === "string" && body.email.trim() && body.email !== user.email) {
      const { error: emailErr } = await supabase.auth.updateUser({
        email: body.email.trim(),
      });
      if (emailErr) {
        return NextResponse.json(
          { error: emailErr.message || "Could not update email." },
          { status: 400 },
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[brand/profile] PATCH", e);
    return NextResponse.json(
      { error: e.message || "Could not update profile." },
      { status: 500 },
    );
  }
}
