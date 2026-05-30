// Lightweight admin gate. Reads ADMIN_EMAILS from the environment as a
// comma-separated allowlist; the auth'd user's email must match (case-
// insensitive) to be considered an admin.
//
// Server-only — never expose ADMIN_EMAILS to the browser.

import { createClient } from "@/lib/supabase/server";

export function getAdminEmails() {
  const raw = process.env.ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function getAdminUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  const allow = getAdminEmails();
  if (allow.length === 0) return null;
  if (!allow.includes(user.email.toLowerCase())) return null;
  return user;
}
