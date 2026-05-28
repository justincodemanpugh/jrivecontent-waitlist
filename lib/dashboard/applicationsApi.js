// Application lifecycle: creator applies, brand reviews & accepts/declines.
// Accepting also opens a conversation between the brand and creator.

import { createClient } from "@/lib/supabase/client";
import {
  isBrandPro,
  FREE_ACCEPTED_CREATORS_TOTAL,
} from "@/lib/dashboard/brand/gigsApi";

function notifyApplicationsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("applications:changed"));
  }
}

function notifyConversationsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("conversations:changed"));
  }
}

// ---------------------------------------------------------------------------
// Creator side
// ---------------------------------------------------------------------------

export async function applyToGig({ gigId, brandId, pitch }) {
  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Sign in to apply.");

  const { data, error } = await supabase
    .from("gig_applications")
    .insert({
      gig_id: gigId,
      brand_id: brandId,
      creator_id: user.id,
      pitch: (pitch || "").trim(),
      status: "pending",
    })
    .select()
    .single();
  if (error) {
    if (error.code === "23505") {
      throw new Error("You've already applied to this gig.");
    }
    throw error;
  }
  notifyApplicationsChanged();
  return data;
}

export async function withdrawApplication(applicationId) {
  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("You need to be signed in to withdraw an application.");
  const { error } = await supabase
    .from("gig_applications")
    .update({ status: "withdrawn" })
    .eq("id", applicationId)
    .eq("creator_id", user.id);
  if (error) throw error;
  notifyApplicationsChanged();
}

export async function fetchMyApplications() {
  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("You need to be signed in to view your applications.");
  const { data, error } = await supabase
    .from("gig_applications")
    .select(
      `id, status, pitch, created_at, gig_id, brand_id,
       gig:gigs ( id, title, brand_name, pay_per_video )`,
    )
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchMyApplicationForGig(gigId) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("gig_applications")
    .select("id, status, pitch, created_at")
    .eq("gig_id", gigId)
    .eq("creator_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

// ---------------------------------------------------------------------------
// Brand side
// ---------------------------------------------------------------------------

export async function fetchApplicantsForGig(gigId) {
  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("You need to be signed in to view applicants.");

  // Verify the gig belongs to this brand before fetching applications.
  // RLS on gig_applications already restricts SELECT to the gig's brand,
  // but this gives a clear error instead of a silent empty list when a
  // brand tries to view another brand's applicants.
  const { data: gig, error: gigErr } = await supabase
    .from("gigs")
    .select("id")
    .eq("id", gigId)
    .eq("brand_id", user.id)
    .maybeSingle();
  if (gigErr) throw gigErr;
  if (!gig) throw new Error("Gig not found.");

  const { data, error } = await supabase
    .from("gig_applications")
    .select(
      `id, status, pitch, created_at, creator_id,
       creator:creator_profiles!gig_applications_creator_id_fkey (
         user_id, display_name, handle, avatar_url, bio, niches,
         instagram_handle, tiktok_handle, youtube_handle, location
       )`,
    )
    .eq("gig_id", gigId)
    .eq("brand_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function declineApplication(applicationId) {
  const supabase = createClient();
  const { error } = await supabase
    .from("gig_applications")
    .update({ status: "declined" })
    .eq("id", applicationId);
  if (error) throw error;
  notifyApplicationsChanged();
}

// Flip a previously declined application back to pending so the brand
// can reconsider. RLS already restricts updates to the gig's brand.
export async function undoDeclineApplication(applicationId) {
  const supabase = createClient();
  const { error } = await supabase
    .from("gig_applications")
    .update({ status: "pending" })
    .eq("id", applicationId)
    .eq("status", "declined");
  if (error) throw error;
  notifyApplicationsChanged();
}

// Roster view: every applicant across every gig owned by the signed-in
// brand. Withdrawn applications are filtered out (creator pulled out).
// Optional `status` arg narrows to a single status tab.
export async function fetchAllApplicants({ status } = {}) {
  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("You need to be signed in to view applicants.");

  let query = supabase
    .from("gig_applications")
    .select(
      `id, status, pitch, created_at, creator_id, gig_id, brand_id,
       gig:gigs ( id, title ),
       creator:creator_profiles!gig_applications_creator_id_fkey (
         user_id, display_name, handle, avatar_url, bio, niches,
         instagram_handle, tiktok_handle, youtube_handle, location
       )`,
    )
    .eq("brand_id", user.id)
    .neq("status", "withdrawn")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Count of new pending applications for the sidebar badge.
export async function fetchPendingApplicantCount() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;
  const { count, error } = await supabase
    .from("gig_applications")
    .select("id", { count: "exact", head: true })
    .eq("brand_id", user.id)
    .eq("status", "pending");
  if (error) return 0;
  return count ?? 0;
}

// Look up the conversation that was created when an application was
// accepted. Returns null if no conversation exists yet.
export async function fetchConversationForApplication({ gigId, creatorId }) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("id")
    .eq("gig_id", gigId)
    .eq("creator_id", creatorId)
    .maybeSingle();
  if (error) return null;
  return data || null;
}

// Accept = mark application accepted + ensure a conversation exists.
// Returns the conversation row so the brand can navigate to it.
export async function acceptApplication(application) {
  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Sign in required.");

  // Free-tier gate: free brands can only ever accept 1 creator across
  // applications + invitations. Re-accepting the same application is a
  // no-op (status already 'accepted') so we only block net-new accepts.
  if (!(await isBrandPro(supabase, user.id))) {
    const [appsRes, invitesRes] = await Promise.all([
      supabase
        .from("gig_applications")
        .select("id", { count: "exact", head: true })
        .eq("brand_id", user.id)
        .eq("status", "accepted"),
      supabase
        .from("gig_invitations")
        .select("id", { count: "exact", head: true })
        .eq("brand_id", user.id)
        .eq("status", "accepted"),
    ]);
    const alreadyAccepted =
      (appsRes.count ?? 0) + (invitesRes.count ?? 0);
    if (alreadyAccepted >= FREE_ACCEPTED_CREATORS_TOTAL) {
      throw new Error(
        "You've already accepted your free creator. Upgrade to Pro to work with more creators.",
      );
    }
  }

  const { error: updErr } = await supabase
    .from("gig_applications")
    .update({ status: "accepted" })
    .eq("id", application.id);
  if (updErr) throw updErr;

  // Ensure conversation exists. Unique (gig_id, creator_id) prevents dupes.
  const { data: existing } = await supabase
    .from("conversations")
    .select("*")
    .eq("gig_id", application.gig_id)
    .eq("creator_id", application.creator_id)
    .maybeSingle();

  let conversation = existing;
  if (!conversation) {
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        gig_id: application.gig_id,
        application_id: application.id,
        brand_id: user.id,
        creator_id: application.creator_id,
      })
      .select()
      .single();
    if (error) throw error;
    conversation = data;
  }

  // Drop a system message so both sides see the kickoff.
  await supabase.from("messages").insert({
    conversation_id: conversation.id,
    sender_id: user.id,
    body: "Brand accepted the application — let's get started!",
    kind: "system",
  });

  notifyApplicationsChanged();
  notifyConversationsChanged();
  return conversation;
}
