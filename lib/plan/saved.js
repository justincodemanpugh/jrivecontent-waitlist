// What of a plan gets stored, and what is removed again when it is read.
// Pure, so both are tested (scripts/test-plan.mjs).

const CREATOR_FIELDS = [
  "id",
  "source",
  "name",
  "handle",
  "tiktok_handle",
  "username",
  "avatar_url",
  "follower_count",
  "rate_min",
  "rate_max",
  "niche",
  "niches",
  "outsideNiche",
];

// Keeps only what the plan shows: no bios or bio links of scraped accounts.
export function storablePlan(plan) {
  return {
    ...plan,
    creators: plan.creators.map((c) =>
      Object.fromEntries(CREATOR_FIELDS.filter((f) => c[f] !== undefined).map((f) => [f, c[f]])),
    ),
  };
}

// A saved plan outlives the accounts in it. Drop anyone who has since opted
// out of discovery or deleted their account, and their videos.
// `directoryIds` and `platformIds` are the ones still available.
export function dropUnavailable(plan, { directoryIds, platformIds }) {
  return {
    ...plan,
    creators: plan.creators.filter((c) =>
      c.source === "platform" ? platformIds.has(c.id) : directoryIds.has(c.id),
    ),
    videos: plan.videos.filter((v) => directoryIds.has(v.creator_id)),
  };
}
