// Creator codes: what a creator tells viewers to enter in the brand's app
// ("use code JUSTIN"). One code per (brand, creator), shared by all of
// that brand's campaigns. Server-only.

export function normalizeCode(raw) {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/^@/, "")
    .replace(/[^A-Z0-9_]/g, "")
    .slice(0, 20);
}

// Candidate codes from the creator's handle or name, then numbered
// variants, so two creators named "alex" both get a working code.
function candidates(base) {
  const root = normalizeCode(base).slice(0, 16) || "CREATOR";
  const padded = root.length >= 3 ? root : `${root}CODE`.slice(0, 16);
  const list = [padded];
  for (let i = 2; i < 50; i += 1) list.push(`${padded}${i}`);
  return list;
}

// Return the brand's code for this creator, creating one if needed.
export async function ensureCreatorCode(admin, { brandId, creatorId }) {
  const { data: existing } = await admin
    .from("creator_codes")
    .select("code")
    .eq("brand_id", brandId)
    .eq("creator_id", creatorId)
    .maybeSingle();
  if (existing?.code) return existing.code;

  const { data: profile } = await admin
    .from("creator_profiles")
    .select("tiktok_handle, handle, display_name")
    .eq("user_id", creatorId)
    .maybeSingle();
  const base = profile?.tiktok_handle || profile?.handle || profile?.display_name || "CREATOR";

  for (const code of candidates(base)) {
    const { data, error } = await admin
      .from("creator_codes")
      .insert({ brand_id: brandId, creator_id: creatorId, code })
      .select("code")
      .maybeSingle();
    if (!error && data) return data.code;
    if (error?.code !== "23505") throw error;
    // Unique violation: either this code is taken by another creator, or a
    // concurrent call just created this creator's code. Check the latter.
    const { data: raced } = await admin
      .from("creator_codes")
      .select("code")
      .eq("brand_id", brandId)
      .eq("creator_id", creatorId)
      .maybeSingle();
    if (raced?.code) return raced.code;
  }
  throw new Error("Could not allocate a creator code");
}

// Codes for every active member of a brand's rev-share campaigns.
export async function ensureCodesForBrand(admin, brandId) {
  const { data: programs, error } = await admin
    .from("programs")
    .select("id, revshare_bps, program_members ( creator_id, status )")
    .eq("brand_id", brandId)
    .gt("revshare_bps", 0)
    .neq("status", "archived");
  if (error) throw error;

  const creatorIds = new Set();
  for (const p of programs || []) {
    for (const m of p.program_members || []) {
      if (m.status === "active" || m.status === "invited") creatorIds.add(m.creator_id);
    }
  }

  const codes = {};
  for (const creatorId of creatorIds) {
    codes[creatorId] = await ensureCreatorCode(admin, { brandId, creatorId });
  }
  return codes;
}
