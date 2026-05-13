// Compute a simple "profile strength" score from the creator profile fields
// that are available via CreatorProvider. Each filled-in field contributes
// equally so the value moves as creators complete their profile.

const FIELDS = [
  (c) => Boolean(c?.name && c.name !== "Creator"),
  (c) => Boolean(c?.handle),
  (c) => Boolean(c?.bio && c.bio.trim().length > 0),
  (c) => Boolean(c?.avatarUrl),
  (c) => Array.isArray(c?.niches) && c.niches.length > 0,
  (c) => Boolean(c?.stripePayoutsEnabled),
];

export function computeProfileStrength(creator) {
  if (!creator) return 0;
  const filled = FIELDS.reduce((n, fn) => n + (fn(creator) ? 1 : 0), 0);
  return Math.round((filled / FIELDS.length) * 100);
}
