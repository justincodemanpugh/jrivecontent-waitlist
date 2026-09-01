// POST /api/discovery/opt-out
//
// Removes a scraped profile from the public /creators directory. Accepts a
// plain HTML form post (no JS on the page) and redirects back with a status,
// so removal works for anyone who can load a web page.
//
// This is intentionally not identity-checked. Requiring someone to prove they
// own a TikTok account before we stop publishing their scraped data gets the
// burden backwards: they never opted in. The abuse case is someone removing a
// competitor, which costs us one directory row and is reversible on our side.
// The opposite failure — a creator who cannot get themselves delisted — is not
// acceptable, so removal stays one field and one click.
//
// Writes with the service-role client: discovery_optouts has RLS on and no
// policies, so it is never anon-writable directly.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseTikTokUsername } from "@/lib/apify/tiktokScraper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function back(request, status) {
  const url = new URL("/creators/opt-out", request.url);
  url.searchParams.set("status", status);
  // 303 so the browser follows with GET after the form POST.
  return NextResponse.redirect(url, 303);
}

export async function POST(request) {
  const form = await request.formData().catch(() => null);
  const username = parseTikTokUsername(form?.get("username") || "");

  if (!username) return back(request, "invalid");

  const admin = createAdminClient();

  const { error: optErr } = await admin
    .from("discovery_optouts")
    .upsert(
      { platform: "tiktok", username, reason: String(form.get("reason") || "").slice(0, 500) || null },
      { onConflict: "platform,username" },
    );

  if (optErr) {
    console.error("[discovery-optout] insert failed", optErr);
    return back(request, "error");
  }

  // Hide the row if we already have one. `hidden` is never cleared by the seed
  // or refresh crons, so this is permanent.
  const { error: hideErr } = await admin
    .from("discovered_creators")
    .update({ hidden: true })
    .eq("platform", "tiktok")
    .ilike("username", username);

  if (hideErr) {
    console.error("[discovery-optout] hide failed", hideErr);
    return back(request, "error");
  }

  return back(request, "done");
}
