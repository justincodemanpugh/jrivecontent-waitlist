// Assignments API for the creator dashboard.
// An "assignment" is a brief_recipients row: a brief a brand sent to this
// creator. Creators see escrow status ("Payment Secured"), upload a video
// directly, and track brand review feedback.

import { createClient } from "@/lib/supabase/client";

function notifyAssignmentsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("assignments:changed"));
  }
}

// ---------------------------------------------------------------------------
// Listing
// ---------------------------------------------------------------------------

function mapRecipient(r) {
  const brief = r.briefs || r.brief || {};
  const payment = Array.isArray(r.brief_payments)
    ? r.brief_payments[0]
    : r.brief_payments;
  return {
    id: r.id,
    briefId: brief.id,
    title: brief.title || "Assignment",
    instructions: brief.instructions || "",
    payPerCreator: brief.pay_per_creator,
    deadline: brief.deadline,
    brandName: brief.brand_profiles?.brand_name || "Brand",
    status: r.status,
    sentAt: r.sent_at,
    viewedAt: r.viewed_at,
    escrowStatus: r.escrow_status || "none",
    submissionStoragePath: r.submission_storage_path || null,
    submissionUploadedAt: r.submission_uploaded_at || null,
    reviewStatus: r.review_status || "pending",
    reviewFeedback: r.review_feedback || null,
    reviewedAt: r.reviewed_at || null,
    payoutCents: payment?.creator_payout_cents ?? null,
    exampleVideos: (brief.brief_example_videos || [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((v) => ({
        id: v.id,
        storagePath: v.storage_path,
        position: v.position,
      })),
  };
}

const ASSIGNMENT_SELECT = `
  id, creator_id, status, sent_at, viewed_at,
  escrow_status, submission_storage_path, submission_size_bytes,
  submission_mime_type, submission_uploaded_at,
  review_status, review_feedback, reviewed_at,
  briefs (
    id, title, instructions, pay_per_creator, deadline, status,
    brand_profiles!briefs_brand_id_fkey_profile ( brand_name ),
    brief_example_videos ( id, storage_path, position )
  ),
  brief_payments ( id, status, creator_payout_cents )
`;

// All assignments sent to the current creator.
export async function fetchMyAssignments() {
  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Authentication required");

  const { data, error } = await supabase
    .from("brief_recipients")
    .select(ASSIGNMENT_SELECT)
    .eq("creator_id", user.id)
    .order("sent_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapRecipient);
}

// A single assignment by recipient id.
export async function fetchAssignmentById(recipientId) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("brief_recipients")
    .select(ASSIGNMENT_SELECT)
    .eq("id", recipientId)
    .single();
  if (error) throw error;
  return mapRecipient(data);
}

// Mark an assignment as viewed (first open).
export async function markAssignmentViewed(recipientId) {
  const supabase = createClient();
  const { error } = await supabase
    .from("brief_recipients")
    .update({ status: "viewed", viewed_at: new Date().toISOString() })
    .eq("id", recipientId)
    .eq("status", "pending");
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Video upload
// ---------------------------------------------------------------------------

// Upload a submission video to the brief-submissions bucket and attach it to
// the recipient row. Path: {creator_id}/{recipient_id}/{uuid}.{ext}
export async function uploadAssignmentVideo(recipientId, file) {
  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Authentication required");

  const ext = (file.name?.split(".").pop() || "mp4").toLowerCase();
  const path = `${user.id}/${recipientId}/${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("brief-submissions")
    .upload(path, file, {
      contentType: file.type || "video/mp4",
      upsert: false,
    });
  if (upErr) throw upErr;

  const { error: updErr } = await supabase
    .from("brief_recipients")
    .update({
      submission_storage_path: path,
      submission_size_bytes: file.size || null,
      submission_mime_type: file.type || null,
      submission_uploaded_at: new Date().toISOString(),
      // Re-submitting after a change request resets review back to pending.
      review_status: "pending",
      review_feedback: null,
    })
    .eq("id", recipientId);
  if (updErr) throw updErr;

  notifyAssignmentsChanged();
  return { storagePath: path };
}

// Signed URL for the creator's own uploaded video (preview after upload).
export async function getAssignmentVideoUrl(storagePath) {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("brief-submissions")
    .createSignedUrl(storagePath, 3600);
  if (error) throw error;
  return data.signedUrl;
}

// Signed URL for an example video the brand attached (brief-videos bucket).
export async function getExampleVideoUrl(storagePath) {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("brief-videos")
    .createSignedUrl(storagePath, 3600);
  if (error) throw error;
  return data.signedUrl;
}
