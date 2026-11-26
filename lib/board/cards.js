// The creator columns. Pure (scripts/test-week.mjs).

export const STATUSES = [
  { id: "to_message", label: "To message" },
  { id: "messaged", label: "Messaged" },
  { id: "said_yes", label: "Said yes" },
  { id: "posting", label: "Posting" },
];

export const isStatus = (value) => value === "removed" || STATUSES.some((s) => s.id === value);

// The creators in a saved plan, as cards to start with.
export function seedRows(plan, brandId) {
  return plan.creators.map((c) => ({
    brand_id: brandId,
    source: c.source,
    creator_ref: String(c.id),
    name: c.name,
    handle: (c.source === "platform" ? c.tiktok_handle : c.username)?.replace(/^@/, "") || "",
  }));
}

// The creator's account, if they have one: only then can they be invited to a
// campaign and paid.
export const memberId = (card) =>
  card.joined_creator_id || (card.source === "platform" ? card.creator_ref : null);

// Drop removed cards, deleted accounts, and scraped accounts that have since
// opted out. `directoryIds` and `memberIds` are the ones still available.
export function visibleCards(cards, { directoryIds, memberIds }) {
  return cards.filter((card) => {
    if (card.status === "removed") return false;
    const member = memberId(card);
    if (member) return memberIds.has(member);
    return card.source === "directory" ? directoryIds.has(card.creator_ref) : card.source === "manual";
  });
}

// A TikTok handle from "@name", "name" or a profile link; null otherwise.
export function normalizeHandle(raw) {
  const text = String(raw || "").trim();
  const fromLink = text.match(/tiktok\.com\/@([A-Za-z0-9._]+)/i);
  const handle = (fromLink ? fromLink[1] : text.replace(/^@/, "")).toLowerCase();
  return /^[a-z0-9._]{2,24}$/.test(handle) ? handle : null;
}

export const messageFor = (lines, name) => lines.join("\n").replace("[their name]", () => name);
