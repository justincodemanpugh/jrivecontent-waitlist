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
