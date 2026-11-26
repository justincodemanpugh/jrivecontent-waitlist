import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safePath } from "@/lib/auth/safePath";

// Handles both the PKCE `?code=...` callback (OAuth + magic links sent via
// `@supabase/ssr`) and the legacy/email-confirmation `?token_hash=...&type=...`
// callback. Role-aware onboarding/dashboard routing is handled downstream by
// `/dashboard` (the router page) and the per-role dashboard layouts, so we
// don't decide between brand/creator here.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  // `next` comes from the address bar, so only follow it within this site.
  const next = safePath(searchParams.get("next"), "/dashboard", origin);

  const supabase = createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(
      `${origin}/signin?error=${encodeURIComponent(error.message)}`,
    );
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(
      `${origin}/signin?error=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(`${origin}/signin?error=missing_code`);
}
