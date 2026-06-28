// Aggregations powering the brand dashboard home (stats strip + "Needs
// your attention" feed). Updated for briefs-first model.

import { createClient } from "@/lib/supabase/client";

function startOfThisMonthIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

function sevenDaysAgoIso() {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

const EMPTY_STATS = {
  activeBriefs: 0,
  connectedCreators: 0,
  videosPendingReview: 0,
  completedThisMonth: 0,
  completionRate: 0,
  newCreatorsThisWeek: 0,
};

// Returns the six numbers shown in StatStrip. All values are scoped to the
// signed-in brand.
//
//   activeBriefs:         briefs the brand currently has active
//   connectedCreators:    creators in the brand's roster (active connections)
//   videosPendingReview:  uploaded creator videos awaiting the brand's review
//   completedThisMonth:   videos the brand approved this calendar month
//   completionRate:       approved recipients / all recipients (%)
//   newCreatorsThisWeek:  creators that connected in the last 7 days
//
// Submission + review state lives on `brief_recipients` (see migration 0026),
// so all derived metrics are scoped to the brand by joining briefs!inner.
export async function fetchDashboardStats() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ...EMPTY_STATS };

  const stats = { ...EMPTY_STATS };

  try {
    const [
      briefsRes,
      creatorsRes,
      pendingReviewRes,
      completedMonthRes,
      totalRecipientsRes,
      approvedRecipientsRes,
      newCreatorsRes,
    ] = await Promise.all([
      // Active briefs.
      supabase
        .from("briefs")
        .select("id", { count: "exact", head: true })
        .eq("brand_id", user.id)
        .eq("status", "active"),
      // Connected creators (active roster).
      supabase
        .from("brand_creators")
        .select("id", { count: "exact", head: true })
        .eq("brand_id", user.id)
        .eq("status", "active"),
      // Videos uploaded by creators that still need the brand's review.
      supabase
        .from("brief_recipients")
        .select("id, briefs!inner(brand_id)", { count: "exact", head: true })
        .eq("briefs.brand_id", user.id)
        .not("submission_storage_path", "is", null)
        .eq("review_status", "pending"),
      // Videos approved this calendar month.
      supabase
        .from("brief_recipients")
        .select("id, briefs!inner(brand_id)", { count: "exact", head: true })
        .eq("briefs.brand_id", user.id)
        .eq("review_status", "approved")
        .gte("reviewed_at", startOfThisMonthIso()),
      // All recipients across the brand's briefs (completion-rate denominator).
      supabase
        .from("brief_recipients")
        .select("id, briefs!inner(brand_id)", { count: "exact", head: true })
        .eq("briefs.brand_id", user.id),
      // Approved recipients across all time (completion-rate numerator).
      supabase
        .from("brief_recipients")
        .select("id, briefs!inner(brand_id)", { count: "exact", head: true })
        .eq("briefs.brand_id", user.id)
        .eq("review_status", "approved"),
      // Creators connected in the last 7 days.
      supabase
        .from("brand_creators")
        .select("id", { count: "exact", head: true })
        .eq("brand_id", user.id)
        .eq("status", "active")
        .gte("added_at", sevenDaysAgoIso()),
    ]);

    const totalRecipients = totalRecipientsRes.count ?? 0;
    const approvedRecipients = approvedRecipientsRes.count ?? 0;

    stats.activeBriefs = briefsRes.count ?? 0;
    stats.connectedCreators = creatorsRes.count ?? 0;
    stats.videosPendingReview = pendingReviewRes.count ?? 0;
    stats.completedThisMonth = completedMonthRes.count ?? 0;
    stats.completionRate = totalRecipients
      ? Math.round((approvedRecipients / totalRecipients) * 100)
      : 0;
    stats.newCreatorsThisWeek = newCreatorsRes.count ?? 0;
  } catch (e) {
    // Tables may not exist yet, return zeros.
    console.warn("Brief tables not ready:", e.message);
  }

  return stats;
}

// Returns the list shown in NeedsAttention. We surface up to 5 items,
// prioritized as:
//   1. Deliverables awaiting approval (most urgent — money is escrowed)
//   2. Gigs with new pending applicants
//   3. Recent inbound messages from creators
export async function fetchAttentionItems({ limit = 5 } = {}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const items = [];

  // 1. Submitted deliverables awaiting brand approval.
  const { data: pendingDeliverables } = await supabase
    .from("deliverables")
    .select(
      `id, created_at, conversation_id,
       gig:gigs ( id, title ),
       creator:creator_profiles!deliverables_creator_id_fkey (
         display_name, handle
       )`,
    )
    .eq("status", "submitted")
    .order("created_at", { ascending: false })
    .limit(limit);

  (pendingDeliverables || []).forEach((d) => {
    const creatorName =
      d.creator?.display_name || (d.creator?.handle ? `@${d.creator.handle}` : "A creator");
    items.push({
      id: `deliverable-${d.id}`,
      type: "delivery",
      title: `Video delivered for "${d.gig?.title || "your gig"}"`,
      subtitle: `By ${creatorName} · awaiting your approval`,
      cta: "Review",
      href: `/dashboard/brand/messages/${d.conversation_id}`,
      timestamp: d.created_at,
    });
  });

  // 2. Gigs with pending applicants — one row per gig, counting how many.
  const { data: pendingApps } = await supabase
    .from("gig_applications")
    .select(
      `id, created_at, gig_id,
       gig:gigs ( id, title, pay_per_video, created_at )`,
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const byGig = new Map();
  (pendingApps || []).forEach((a) => {
    if (!a.gig) return;
    const entry = byGig.get(a.gig_id);
    if (entry) {
      entry.count += 1;
      if (new Date(a.created_at) > new Date(entry.latest)) {
        entry.latest = a.created_at;
      }
    } else {
      byGig.set(a.gig_id, {
        gig: a.gig,
        count: 1,
        latest: a.created_at,
      });
    }
  });

  byGig.forEach(({ gig, count, latest }) => {
    const budget = Number(gig.pay_per_video) || 0;
    const days = gig.created_at
      ? Math.floor(
          (Date.now() - new Date(gig.created_at).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;
    const posted =
      days < 1 ? "Posted today" : days === 1 ? "Posted yesterday" : `Posted ${days} days ago`;
    items.push({
      id: `apps-${gig.id}`,
      type: "applicants",
      title:
        count === 1
          ? `1 new applicant on "${gig.title}"`
          : `${count} new applicants on "${gig.title}"`,
      subtitle: `${posted}${budget ? ` · $${budget} budget` : ""}`,
      cta: "Review",
      href: `/dashboard/brand/gigs/${gig.id}`,
      timestamp: latest,
    });
  });

  // 3. Recent inbound messages from creators. We don't track unread
  // state yet, so we surface the most recent non-system message that
  // the brand didn't send themselves.
  const { data: recentMessages } = await supabase
    .from("messages")
    .select(
      `id, body, sender_id, created_at, conversation_id, kind,
       conversation:conversations!messages_conversation_id_fkey (
         id, brand_id, creator_id,
         creator:creator_profiles!conversations_creator_id_fkey (
           display_name, handle
         )
       )`,
    )
    .neq("kind", "system")
    .neq("sender_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  // Only keep messages on conversations the current user is the brand on,
  // and dedupe so we only surface the latest message per conversation.
  const seenConvos = new Set();
  (recentMessages || []).forEach((m) => {
    if (!m.conversation || m.conversation.brand_id !== user.id) return;
    if (seenConvos.has(m.conversation_id)) return;
    seenConvos.add(m.conversation_id);
    const creatorName =
      m.conversation.creator?.handle
        ? `@${m.conversation.creator.handle}`
        : m.conversation.creator?.display_name || "a creator";
    const snippet = (m.body || "").trim().slice(0, 80);
    items.push({
      id: `message-${m.id}`,
      type: "message",
      title: `New message from ${creatorName}`,
      subtitle: snippet ? `"${snippet}${m.body.length > 80 ? "…" : ""}"` : "Tap to read",
      cta: "Reply",
      href: `/dashboard/brand/messages/${m.conversation_id}`,
      timestamp: m.created_at,
    });
  });

  // Newest-first across all categories, capped at `limit`.
  items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return items.slice(0, limit);
}
