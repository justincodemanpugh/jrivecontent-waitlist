import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Exchanges the OAuth/magic-link `code` for a session, then hands off to the
// requested `next` destination. Role-aware onboarding/dashboard routing is
// handled downstream by `/dashboard` (the router page) and the per-role
// dashboard layouts, so we don't decide between brand/creator here.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
