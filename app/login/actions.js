"use server";

import { cookies } from "next/headers";
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

  // Stash the post-auth destination in a short-lived cookie. Many custom
  // Supabase email templates use `{{ .TokenHash }}` and hardcode the callback
  // URL, dropping any query params we set via emailRedirectTo. The cookie acts
  // as a reliable fallback for the /auth/callback route on the same device.
  cookies().set("auth_next", next, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60, // 1 hour — long enough for the user to click the email
  });

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo },
  });

  if (error) {
    return { error: error.message };
  }

  return { ok: true };
}
