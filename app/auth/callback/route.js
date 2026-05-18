import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  // Custom Supabase email templates that hardcode the callback URL often
  // drop the `next` query param. `sendMagicLink` stashes it in an httpOnly
  // cookie as a same-device fallback so we still know where to send the user
  // (e.g. /dashboard?role=creator for fresh sign-ups).
  const cookieStore = cookies();
  const cookieNext = cookieStore.get("auth_next")?.value;
  const next = searchParams.get("next") || cookieNext || "/dashboard";
  if (cookieNext) {
    cookieStore.set("auth_next", "", { path: "/", maxAge: 0 });
  }

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
