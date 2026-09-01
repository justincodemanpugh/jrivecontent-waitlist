// Shared constants and formatters for the creator directory.
//
// Deliberately free of any server-only import (no next/headers, no Supabase
// server client) so both the client-side query layer in
// lib/dashboard/brand/discoveryApi.js and the card component can use it.
// The query itself lives in discoveryApi.js.

export const PAGE_SIZE = 24;

export const SORTS = {
  followers: { label: "Most followers", column: "follower_count" },
  engagement: { label: "Most likes per video", column: "avg_likes_per_video" },
  newest: { label: "Recently added", column: "created_at" },
};

export const FOLLOWER_RANGES = {
  "1k-10k": { label: "1K – 10K", min: 1000, max: 10000 },
  "10k-100k": { label: "10K – 100K", min: 10000, max: 100000 },
  "100k-1m": { label: "100K – 1M", min: 100000, max: 1000000 },
  "1m+": { label: "1M+", min: 1000000, max: null },
};

// PostgREST's .or() takes a comma-separated filter string, so a raw query
// containing commas or parens would change the filter's meaning. Strip the
// characters that are structural rather than trying to escape them.
export function sanitizeQuery(raw) {
  return String(raw || "").trim().replace(/[,()%*\\]/g, "").slice(0, 80);
}

// TikTok bios routinely carry a booking email. Even behind the dashboard we
// strip them: the bio is scraped from someone who never signed up, and
// surfacing their inbox is a step past showing public profile stats. The raw
// bio stays in the row, so this is reversible if we ever get consent.
const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

export function redactContact(bio) {
  if (!bio) return "";
  return String(bio).replace(EMAIL_RE, "[email]").trim();
}

export function tiktokProfileUrl(username) {
  return `https://www.tiktok.com/@${encodeURIComponent(username)}`;
}

export function formatCount(n) {
  const num = Number(n) || 0;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(num >= 10_000_000 ? 0 : 1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(num >= 10_000 ? 0 : 1)}K`;
  return String(num);
}
