"use server";

import { createClient } from "@/lib/supabase/server";

// Server action for sending magic links. Doing this on the server avoids the
// browser PKCE flow entirely — Safari ITP and cross-device clicks (request on
// desktop, open on phone) frequently break the PKCE verifier that the browser
// client tries to stash, surfacing as "PKCE code verifier not found in
// storage". Email templates use `{{ .TokenHash }}` so the link our
// /auth/callback route receives can be verified with `verifyOtp` directly.
export async function sendMagicLink(formData) {
  const email = String(formData.get("email") || "").trim();
  const next = String(formData.get("next") || "/dashboard");

  if (!email) {
    return { error: "Email is required." };
  }

  const supabase = createClient();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.jrivecontent.com";
  const emailRedirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo },
  });

  if (error) {
    return { error: error.message };
  }

  return { ok: true };
}
