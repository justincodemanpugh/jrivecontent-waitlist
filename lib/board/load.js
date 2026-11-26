// The brand's creator cards. Server only; callers have already checked that
// the brand is paying.
import { memberId, seedRows, visibleCards } from "@/lib/board/cards";
import { idsStillThere, notHidden } from "@/lib/plan/stored";

// Adds the plan's creators the first time they are seen. Existing cards,
// including removed ones, are left as they are.
async function seed(admin, brandId, plan) {
  if (!plan?.creators.length) return;
  const { error } = await admin
    .from("brand_outreach")
    .upsert(seedRows(plan, brandId), { onConflict: "brand_id,source,creator_ref", ignoreDuplicates: true });
  if (error) throw error;
}

export async function loadCards(admin, brandId, planRow) {
  await seed(admin, brandId, planRow?.plan);

  const { data, error } = await admin
    .from("brand_outreach")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const cards = data || [];
  const directory = cards.filter((c) => c.source === "directory").map((c) => c.creator_ref);
  const members = cards.map(memberId).filter(Boolean);
  const [directoryIds, memberIds] = await Promise.all([
    idsStillThere(admin, "discovered_creators", "id", directory, notHidden),
    idsStillThere(admin, "creator_profiles", "user_id", members),
  ]);
  return visibleCards(cards, { directoryIds, memberIds });
}
