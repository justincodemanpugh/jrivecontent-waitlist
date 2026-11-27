// A same-site path that is safe to redirect to. Callers glue this onto our
// origin, so anything that could change the host ("@evil.com", "//evil.com",
// "/\evil.com", another site's URL) falls back instead.
export function safePath(value, fallback = "/dashboard", origin) {
  if (typeof value !== "string" || !value) return fallback;

  // The magic-link template may hand back a full URL on our own site.
  const path = origin && value.startsWith(`${origin}/`) ? value.slice(origin.length) : value;

  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  // Browsers drop control characters and read backslashes as slashes.
  if (/[\\\u0000-\u001f\u007f]/.test(path)) return fallback;
  return path;
}

const CALLBACK = /^\/auth\/callback(\?|$)/;

// Where a sign-in link should end up. The email template passes the whole
// return address as `next`, and that address is itself
// <site>/auth/callback?next=<where they were going>.
export function signInDestination(next, origin, fallback = "/dashboard") {
  const path = safePath(next, fallback, origin);
  if (!CALLBACK.test(path)) return path;

  const inner = safePath(new URL(path, origin).searchParams.get("next"), fallback, origin);
  return CALLBACK.test(inner) ? fallback : inner;
}
