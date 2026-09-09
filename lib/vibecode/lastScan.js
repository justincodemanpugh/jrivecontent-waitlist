// Remembers the app link someone scanned on /vibecode, in their browser.
//
// Why this exists: the unlock path is scan → /signup → magic link or Google →
// /auth/callback → /dashboard → onboarding. Supabase only preserves its own
// `next` param across that chain, so an `?app=` we attach to the signup link
// is gone by the time the user lands anywhere useful. Rather than thread a
// new param through four hops of a working auth flow, we stash the URL where
// it survives redirects for free.
//
// Client-only, best-effort, and never load-bearing: every caller must still
// work when this returns "". Private windows, blocked site data, and
// thumbnail/preview contexts all make localStorage throw on access, not just
// return null — hence the try/catch on reads as well as writes.
const KEY = "jrive:vibecode:last-scan";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function rememberScan(url) {
  if (typeof window === "undefined") return;
  const value = String(url || "").trim();
  if (!value) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ url: value, at: Date.now() }));
  } catch {
    // Storage unavailable — the flow degrades to the user retyping the link.
  }
}

// Returns the remembered URL, or "" when there isn't a usable recent one.
// Matches the scan cache's own 7-day window: past that the scan would be
// re-run and re-billed anyway, so there's nothing to hand back.
export function recallScan() {
  if (typeof window === "undefined") return "";
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    if (!parsed?.url || typeof parsed.url !== "string") return "";
    if (!Number.isFinite(parsed.at) || Date.now() - parsed.at > MAX_AGE_MS) return "";
    return parsed.url;
  } catch {
    return "";
  }
}
