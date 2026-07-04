// GET /api/auth/tiktok/connect
// Creator-only. Redirects the creator to TikTok's Login Kit authorize page
// so they can connect their TikTok account for Program video tracking.
// TikTok redirects back to /api/auth/tiktok/callback when done.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/stripe/server";
import { signState } from "@/lib/tiktok/oauthState";

export async function GET() {
  const base = siteUrl();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${base}/login`);
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI;
  if (!clientKey || !redirectUri) {
    return NextResponse.redirect(
      `${base}/dashboard/creator/programs?tiktok=not_configured`,
    );
  }

  const authorizeUrl = new URL("https://www.tiktok.com/v2/auth/authorize/");
  authorizeUrl.searchParams.set("client_key", clientKey);
  authorizeUrl.searchParams.set("scope", "user.info.profile,video.list");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("state", signState(user.id));

  return NextResponse.redirect(authorizeUrl.toString());
}
