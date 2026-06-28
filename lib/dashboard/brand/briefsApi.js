// Briefs API for brand dashboard.
// Handles creating, sending, and managing private briefs to connected creators.

import { createClient } from "@/lib/supabase/client";

function notifyBriefsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("briefs:changed"));
  }
}

// ---------------------------------------------------------------------------
// Listing
// ---------------------------------------------------------------------------

// Fetch all briefs created by the current brand.
export async function fetchMyBriefs() {
  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Authentication required");

  const { data, error } = await supabase
    .from("briefs")
    .select(`
      id, title, instructions, pay_per_creator, deadline, status, created_at, updated_at,
      brief_recipients (
        id, creator_id, status, sent_at, viewed_at,
        creator_profiles!brief_recipients_creator_id_fkey_profile (
          display_name, handle, avatar_url
        )
      ),
      brief_example_videos (
        id, storage_path, position, size_bytes, mime_type
      )
    `)
    .eq("brand_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((brief) => ({
    id: brief.id,
    title: brief.title,
    instructions: brief.instructions,
    payPerCreator: brief.pay_per_creator,
    deadline: brief.deadline,
    status: brief.status,
    createdAt: brief.created_at,
    updatedAt: brief.updated_at,
    recipients: (brief.brief_recipients || []).map((r) => ({
      id: r.id,
      creatorId: r.creator_id,
      status: r.status,
      sentAt: r.sent_at,
      viewedAt: r.viewed_at,
      name: r.creator_profiles?.display_name || r.creator_profiles?.handle || "Creator",
      handle: r.creator_profiles?.handle || "",
      avatarUrl: r.creator_profiles?.avatar_url || null,
    })),
    exampleVideos: (brief.brief_example_videos || [])
      .sort((a, b) => a.position - b.position)
      .map((v) => ({
        id: v.id,
        storagePath: v.storage_path,
        position: v.position,
        sizeBytes: v.size_bytes,
        mimeType: v.mime_type,
      })),
  }));
}

// Fetch a single brief by ID.
export async function fetchBriefById(briefId) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("briefs")
    .select(`
      id, title, instructions, pay_per_creator, deadline, status, created_at, updated_at, brand_id,
      brief_recipients (
        id, creator_id, status, sent_at, viewed_at,
        escrow_status, submission_storage_path, submission_size_bytes,
        submission_mime_type, submission_uploaded_at,
        review_status, review_feedback, reviewed_at,
        creator_profiles!brief_recipients_creator_id_fkey_profile (
          display_name, handle, avatar_url
        ),
        brief_submissions (
          id, link_url, platform, notes, created_at
        ),
        brief_payments (
          id, status, amount_cents, platform_fee_cents, creator_payout_cents
        )
      ),
      brief_example_videos (
        id, storage_path, position, size_bytes, mime_type
      )
    `)
    .eq("id", briefId)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    brandId: data.brand_id,
    title: data.title,
    instructions: data.instructions,
    payPerCreator: data.pay_per_creator,
    deadline: data.deadline,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    recipients: (data.brief_recipients || []).map((r) => {
      const payment = Array.isArray(r.brief_payments)
        ? r.brief_payments[0]
        : r.brief_payments;
      return {
        id: r.id,
        creatorId: r.creator_id,
        status: r.status,
        sentAt: r.sent_at,
        viewedAt: r.viewed_at,
        escrowStatus: r.escrow_status || "none",
        submissionStoragePath: r.submission_storage_path || null,
        submissionSizeBytes: r.submission_size_bytes || null,
        submissionMimeType: r.submission_mime_type || null,
        submissionUploadedAt: r.submission_uploaded_at || null,
        reviewStatus: r.review_status || "pending",
        reviewFeedback: r.review_feedback || null,
        reviewedAt: r.reviewed_at || null,
        payment: payment
          ? {
              id: payment.id,
              status: payment.status,
              amountCents: payment.amount_cents,
              platformFeeCents: payment.platform_fee_cents,
              creatorPayoutCents: payment.creator_payout_cents,
            }
          : null,
        name: r.creator_profiles?.display_name || r.creator_profiles?.handle || "Creator",
        handle: r.creator_profiles?.handle || "",
        avatarUrl: r.creator_profiles?.avatar_url || null,
        submissions: (r.brief_submissions || []).map((s) => ({
          id: s.id,
          linkUrl: s.link_url,
          platform: s.platform,
          notes: s.notes,
          createdAt: s.created_at,
        })),
      };
    }),
    exampleVideos: (data.brief_example_videos || [])
      .sort((a, b) => a.position - b.position)
      .map((v) => ({
        id: v.id,
        storagePath: v.storage_path,
        position: v.position,
        sizeBytes: v.size_bytes,
        mimeType: v.mime_type,
      })),
  };
}

// ---------------------------------------------------------------------------
// Creating & Sending Briefs
// ---------------------------------------------------------------------------

// Create a new brief and send to selected creators.
// exampleVideos: array of { storagePath, position, sizeBytes, mimeType }
// recipientIds: array of creator user IDs
export async function createBrief({
  title,
  instructions,
  payPerCreator,
  deadline,
  exampleVideos = [],
  recipientIds = [],
}) {
  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Authentication required");

  if (!title?.trim()) throw new Error("Title is required");
  if (!recipientIds.length) throw new Error("Select at least one creator");

  // Create the brief
  const { data: brief, error: briefErr } = await supabase
    .from("briefs")
    .insert({
      brand_id: user.id,
      title: title.trim(),
      instructions: (instructions || "").trim(),
      pay_per_creator: payPerCreator || null,
      deadline: deadline || null,
    })
    .select()
    .single();

  if (briefErr) throw briefErr;

  // Add example videos
  if (exampleVideos.length > 0) {
    const videoRows = exampleVideos.map((v, i) => ({
      brief_id: brief.id,
      storage_path: v.storagePath,
      position: v.position ?? i,
      size_bytes: v.sizeBytes || null,
      mime_type: v.mimeType || null,
    }));
    const { error: vidErr } = await supabase
      .from("brief_example_videos")
      .insert(videoRows);
    if (vidErr) throw vidErr;
  }

  // Add recipients
  const recipientRows = recipientIds.map((creatorId) => ({
    brief_id: brief.id,
    creator_id: creatorId,
    status: "pending",
  }));
  const { error: recErr } = await supabase
    .from("brief_recipients")
    .insert(recipientRows);
  if (recErr) throw recErr;

  notifyBriefsChanged();
  return brief;
}

// ---------------------------------------------------------------------------
// Video Upload Helpers
// ---------------------------------------------------------------------------

// Upload an example video to the brief-videos bucket.
// Returns the storage path for use in createBrief.
export async function uploadBriefVideo(file, briefId = "draft") {
  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Authentication required");

  const ext = file.name.split(".").pop() || "mp4";
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const path = `${user.id}/${briefId}/${fileName}`;

  const { error } = await supabase.storage
    .from("brief-videos")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;

  return {
    storagePath: path,
    sizeBytes: file.size,
    mimeType: file.type,
  };
}

// Get a signed URL for a brief video.
export async function getBriefVideoUrl(storagePath) {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("brief-videos")
    .createSignedUrl(storagePath, 3600); // 1 hour expiry

  if (error) throw error;
  return data.signedUrl;
}

// Delete a brief video from storage.
export async function deleteBriefVideo(storagePath) {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from("brief-videos")
    .remove([storagePath]);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Brief Management
// ---------------------------------------------------------------------------

// Archive a brief.
export async function archiveBrief(briefId) {
  const supabase = createClient();
  const { error } = await supabase
    .from("briefs")
    .update({ status: "archived" })
    .eq("id", briefId);
  if (error) throw error;
  notifyBriefsChanged();
}

// Reactivate an archived brief.
export async function reactivateBrief(briefId) {
  const supabase = createClient();
  const { error } = await supabase
    .from("briefs")
    .update({ status: "active" })
    .eq("id", briefId);
  if (error) throw error;
  notifyBriefsChanged();
}

// ---------------------------------------------------------------------------
// Escrow + Submission Review (assignment flow)
// ---------------------------------------------------------------------------

// Fund escrow for a single recipient. Returns a Stripe Checkout URL that the
// caller should redirect the brand to.
export async function fundBriefEscrow(recipientId) {
  const res = await fetch("/api/briefs/escrow/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipientId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Could not start deposit.");
  return json.url;
}

// Approve a creator's uploaded video and release escrow to them.
export async function approveBriefSubmission(recipientId) {
  const res = await fetch("/api/briefs/escrow/release", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipientId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Could not release payment.");
  notifyBriefsChanged();
  return json;
}

// Ask the creator to revise their submission (no payment released).
export async function requestBriefChanges(recipientId, feedback) {
  const supabase = createClient();
  const { error } = await supabase
    .from("brief_recipients")
    .update({
      review_status: "changes_requested",
      review_feedback: (feedback || "").trim() || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", recipientId);
  if (error) throw error;
  notifyBriefsChanged();
}

// Signed URL for a creator's uploaded submission video (brand view).
export async function getBriefSubmissionUrl(storagePath) {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("brief-submissions")
    .createSignedUrl(storagePath, 3600);
  if (error) throw error;
  return data.signedUrl;
}
