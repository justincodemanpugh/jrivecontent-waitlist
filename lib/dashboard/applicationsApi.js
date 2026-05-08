// Application lifecycle: creator applies, brand reviews & accepts/declines.
// Accepting also opens a conversation between the brand and creator.

import { createClient } from "@/lib/supabase/client";

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
  const { error } = await supabase
    .from("gig_applications")
    .update({ status: "withdrawn" })
    .eq("id", applicationId);
  if (error) throw error;
  notifyApplicationsChanged();
}

export async function fetchMyApplications() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("gig_applications")
    .select(
      `id, status, pitch, created_at, gig_id, brand_id,
       gig:gigs ( id, title, brand_name, pay_per_video )`,
    )
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
  // Pull applications + denormalized creator profile fields via the
  // permissive directory-read policy added in schema.sql.
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

// Accept = mark application accepted + ensure a conversation exists.
// Returns the conversation row so the brand can navigate to it.
export async function acceptApplication(application) {
  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Sign in required.");

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
