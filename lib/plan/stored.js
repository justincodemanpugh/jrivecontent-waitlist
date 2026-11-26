// Reading saved plans. Server only.
import { dropUnavailable } from "@/lib/plan/saved";

export async function latestPlan(admin, userId) {
  const { data, error } = await admin
    .from("brand_plans")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function idsStillThere(admin, table, column, ids, filter) {
  if (!ids.length) return new Set();
  let query = admin.from(table).select(column).in(column, ids);
  if (filter) query = filter(query);
  const { data, error } = await query;
  // Failing closed: showing someone who opted out is worse than an error.
  if (error) throw error;
  return new Set((data || []).map((r) => r[column]));
}

export const notHidden = (query) => query.eq("hidden", false);

// The saved plan without anyone who has since opted out or left.
export async function stillAvailable(admin, plan) {
  const directory = [
    ...plan.creators.filter((c) => c.source === "directory").map((c) => c.id),
    ...plan.videos.map((v) => v.creator_id),
  ];
  const platform = plan.creators.filter((c) => c.source === "platform").map((c) => c.id);
  const [directoryIds, platformIds] = await Promise.all([
    idsStillThere(admin, "discovered_creators", "id", directory, notHidden),
    idsStillThere(admin, "creator_profiles", "user_id", platform),
  ]);
  return dropUnavailable(plan, { directoryIds, platformIds });
}
