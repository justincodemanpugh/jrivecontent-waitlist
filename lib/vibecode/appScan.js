// Turn a pasted app link into the few facts the plan generator needs.
// Server-only: it makes outbound requests on behalf of an unauthenticated
// caller, so read the SSRF notes before changing anything here.
//
// Two sources, in order of how good the data is:
//
//   * iOS App Store — the free iTunes lookup API returns a clean title,
//     description, genre and screenshots. No key, no scraping, no HTML.
//   * Anything else (a web app, a Lovable/Bolt deploy, a landing page) —
//     fetch the page and read <title> / meta description / OpenGraph tags.
//     Thinner signal, but it covers the builders who never shipped to a
//     store, which is half the audience /vibecode is aimed at.
//
// Google Play is deliberately not handled yet — it needs real scraping and
// the two sources above cover the MVP. See the TODO below.
import dns from "node:dns/promises";
import net from "node:net";

const FETCH_TIMEOUT_MS = 6000;
// Enough to reach the <head> of any sane page without letting someone point
// us at a multi-gigabyte file.
const MAX_HTML_BYTES = 512 * 1024;
// The model does not get better ideas from a 4000-word store listing, and
// every character is billed.
const MAX_DESCRIPTION_CHARS = 1500;

const UA =
  "Mozilla/5.0 (compatible; JriveContentBot/1.0; +https://www.jrivecontent.com)";

export class ScanError extends Error {
  constructor(message) {
    super(message);
    this.name = "ScanError";
  }
}

// Scheme + host + path, lowercased, query and fragment dropped. The scan
// cache is keyed on this, so it has to be stable across the cosmetic
// variations people actually paste — the `?_r=1&_t=ZS-99...` tail on a
// shared App Store or TikTok link being the common one.
export function normalizeAppUrl(input) {
  const url = toUrl(input);
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const path = url.pathname.replace(/\/+$/, "");
  return `${url.protocol}//${host}${path}`;
}

function toUrl(input) {
  const raw = String(input || "").trim();
  if (!raw) throw new ScanError("Paste a link to your app first.");

  // People paste "myapp.com" far more often than "https://myapp.com".
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;

  let url;
  try {
    url = new URL(withScheme);
  } catch {
    throw new ScanError("That doesn't look like a link. Try the full URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ScanError("Only http and https links can be scanned.");
  }
  return url;
}

// ---------------------------------------------------------------------------
// SSRF guard.
//
// /api/vibecode/scan is public and unauthenticated, and it fetches a URL the
// caller controls. Without this, anyone could use the deployment as a proxy
// to reach the cloud metadata endpoint or something else inside the network.
//
// We resolve the hostname ourselves and refuse any private, loopback, or
// link-local address. This does not close the redirect and DNS-rebinding
// windows (the address could change between our lookup and fetch's own), so
// redirects are capped and nothing about the response body is echoed back to
// the caller — only the parsed title/description reach the response.
// ---------------------------------------------------------------------------
function isBlockedAddress(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true; // link-local + cloud metadata
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast + reserved
    return false;
  }
  if (net.isIPv6(ip)) {
    const v6 = ip.toLowerCase();
    if (v6 === "::1" || v6 === "::") return true;
    if (v6.startsWith("fe80") || v6.startsWith("fc") || v6.startsWith("fd")) return true;

    // IPv4-mapped addresses re-check the embedded IPv4. Both spellings
    // matter: "::ffff:10.0.0.1" is what a person types, but WHATWG URL
    // parsing canonicalises it to the hex form "::ffff:a00:1", which is how
    // it actually arrives here.
    const dotted = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (dotted) return isBlockedAddress(dotted[1]);

    const hex = v6.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (hex) {
      const high = parseInt(hex[1], 16);
      const low = parseInt(hex[2], 16);
      return isBlockedAddress(
        `${high >> 8}.${high & 0xff}.${low >> 8}.${low & 0xff}`,
      );
    }
    return false;
  }
  return true;
}

async function assertPublicHost(url) {
  // URL.hostname keeps the brackets on an IPv6 literal ("[::1]"), which
  // net.isIP does not recognise — strip them so the address check runs
  // instead of falling through to a DNS lookup that only fails by luck.
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") ||
      host.endsWith(".internal") || host.endsWith(".home.arpa")) {
    throw new ScanError("That link points somewhere private. Use your app's public URL.");
  }

  // Refuse bare IP addresses outright rather than trying to decide which
  // ones are safe. Nobody pastes their app's link as an IP, so there is no
  // legitimate traffic to lose here, and it removes the whole class of
  // encoding tricks (IPv4-mapped IPv6, integer and octal notations) in one
  // step. Resolved addresses are still checked below.
  if (net.isIP(host)) {
    throw new ScanError("Use your app's public URL, not an IP address.");
  }

  let addresses;
  try {
    addresses = await dns.lookup(host, { all: true });
  } catch {
    throw new ScanError("We couldn't reach that link. Check the URL and try again.");
  }
  if (addresses.length === 0 || addresses.some((a) => isBlockedAddress(a.address))) {
    throw new ScanError("That link points somewhere private. Use your app's public URL.");
  }
}

// ---------------------------------------------------------------------------

function clean(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_DESCRIPTION_CHARS);
}

// apps.apple.com/us/app/slug/id123456789 — also matches the older
// itunes.apple.com host and links that carry a ?mt= tail.
function appStoreId(url) {
  const host = url.hostname.toLowerCase();
  if (!/(^|\.)apple\.com$/.test(host)) return null;
  const match = url.pathname.match(/\/id(\d+)/);
  return match ? match[1] : null;
}

async function scanAppStore(id) {
  const res = await fetch(
    `https://itunes.apple.com/lookup?id=${encodeURIComponent(id)}&country=us`,
    { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), headers: { "User-Agent": UA } },
  );
  if (!res.ok) {
    throw new ScanError("The App Store didn't return anything for that link.");
  }

  const body = await res.json().catch(() => null);
  const app = body?.results?.[0];
  // A valid-looking id that matches nothing comes back as resultCount: 0
  // rather than an HTTP error.
  if (!app?.trackName) {
    throw new ScanError("We couldn't find that app on the App Store.");
  }

  return {
    source: "ios",
    name: clean(app.trackName),
    description: clean(app.description),
    category: app.primaryGenreName || null,
    iconUrl: app.artworkUrl512 || app.artworkUrl100 || null,
    screenshots: (app.screenshotUrls || []).slice(0, 3),
    ratingCount: Number(app.userRatingCount) || 0,
    storeUrl: app.trackViewUrl || null,
  };
}

function metaContent(html, patterns) {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }
  return "";
}

function decodeEntities(text) {
  return String(text || "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

async function scanWebPage(url) {
  let res;
  try {
    res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    });
  } catch {
    throw new ScanError("We couldn't load that page. Is the link public?");
  }
  if (!res.ok) {
    throw new ScanError(`That page returned ${res.status}. Is the link public?`);
  }

  const type = res.headers.get("content-type") || "";
  if (!type.includes("html") && !type.includes("text/plain")) {
    throw new ScanError("That link isn't a web page we can read.");
  }

  const raw = await res.text();
  const html = raw.slice(0, MAX_HTML_BYTES);

  const ogTitle = metaContent(html, [
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
  ]);
  const title = ogTitle || metaContent(html, [/<title[^>]*>([\s\S]*?)<\/title>/i]);
  const description = metaContent(html, [
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i,
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i,
    /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i,
  ]);
  const image = metaContent(html, [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
  ]);

  const name = clean(decodeEntities(title));
  if (!name) {
    // Nothing to describe means nothing worth spending a model call on.
    throw new ScanError("We couldn't read anything about that page.");
  }

  return {
    source: "web",
    name,
    description: clean(decodeEntities(description)),
    category: null,
    iconUrl: image || null,
    screenshots: [],
    ratingCount: 0,
    storeUrl: url.toString(),
  };
}

// Resolve a pasted link into { source, name, description, category, iconUrl,
// screenshots, ratingCount, storeUrl }. Throws ScanError with a message meant
// to be shown to the person who pasted the link.
export async function scanApp(input) {
  const url = toUrl(input);

  const id = appStoreId(url);
  if (id) {
    // Fixed, trusted host — no SSRF check needed for the lookup API.
    return scanAppStore(id);
  }

  // TODO(play): play.google.com/store/apps/details?id=<pkg> needs real
  // scraping (no public lookup API). Web fallback handles it poorly today.

  await assertPublicHost(url);
  return scanWebPage(url);
}
