// GET /api/auth/tiktok/callback
// TikTok redirects here after the creator approves (or denies) access.
// Exchanges the code for tokens, fetches the TikTok username, and upserts
// creator_social_accounts via the admin client (tokens never touch the
// browser). Always redirects back to the creator's Programs page.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/stripe/server";
import { verifyState } from "@/lib/tiktok/oauthState";
import { exchangeCodeForToken, fetchBasicUserInfo } from "@/lib/tiktok/api";

export async function GET(request) {
  const base = siteUrl();
  const returnTo = `${base}/dashboard/creator/programs`;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${returnTo}?tiktok=denied`);
  }

  const creatorId = state ? verifyState(state) : null;
  if (!creatorId || !code) {
    return NextResponse.redirect(`${returnTo}?tiktok=error`);
  }

  const redirectUri = process.env.TIKTOK_REDIRECT_URI;

  try {
    const token = await exchangeCodeForToken(code, redirectUri);
    let username = null;
    try {
      const info = await fetchBasicUserInfo(token.access_token);
      username = info?.username || info?.display_name || null;
    } catch (e) {
      console.warn("[tiktok/callback] user info fetch failed", e.message);
    }

    const admin = createAdminClient();
    const { error: upsertErr } = await admin
      .from("creator_social_accounts")
      .upsert(
        {
          creator_id: creatorId,
          platform: "tiktok",
          platform_user_id: token.open_id,
          username,
          access_token: token.access_token,
          refresh_token: token.refresh_token || null,
          token_expires_at: new Date(
            Date.now() + Number(token.expires_in || 0) * 1000,
          ).toISOString(),
          scope: token.scope || null,
          connected_at: new Date().toISOString(),
        },
        { onConflict: "creator_id,platform" },
      );
    if (upsertErr) throw upsertErr;

    return NextResponse.redirect(`${returnTo}?tiktok=connected`);
  } catch (e) {
    console.error("[tiktok/callback]", e);
    return NextResponse.redirect(`${returnTo}?tiktok=error`);
  }
}
