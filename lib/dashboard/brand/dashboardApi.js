// Aggregations powering the brand dashboard home (stats strip + "Needs
// your attention" feed). All queries are scoped to the signed-in brand
// via RLS — we never filter by brand_id manually.

import { createClient } from "@/lib/supabase/client";

function startOfThisMonthIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

// Returns the four numbers shown in StatStrip.
//
//   activeGigs:          gigs the brand currently has live (is_active, not deleted)
//   newApplications:     pending applications across all of the brand's gigs
//   awaitingApproval:    deliverables submitted by creators that still need review
//   completedThisMonth:  deliverables approved this calendar month
export async function fetchDashboardStats() {
  const supabase = createClient();

  const [activeGigs, newApplications, awaitingApproval, completedThisMonth] =
    await Promise.all([
      supabase
        .from("gigs")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("is_active", true),
      supabase
        .from("gig_applications")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("deliverables")
        .select("id", { count: "exact", head: true })
        .eq("status", "submitted"),
      supabase
        .from("deliverables")
        .select("id", { count: "exact", head: true })
        .eq("status", "approved")
        .gte("updated_at", startOfThisMonthIso()),
    ]);

  return {
    activeGigs: activeGigs.count ?? 0,
    newApplications: newApplications.count ?? 0,
    awaitingApproval: awaitingApproval.count ?? 0,
    completedThisMonth: completedThisMonth.count ?? 0,
  };
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
