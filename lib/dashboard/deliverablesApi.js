// Deliverable submissions: creator uploads up to 3 videos per submission,
// brand can approve or request revision per submission.

import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/lib/dashboard/messagesApi";

export const MAX_VIDEOS_PER_SUBMISSION = 3;
export const ALLOWED_VIDEO_MIME = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
];
// Hard cap that matches Supabase Storage default per-file limit on the
// free tier. Adjust upward if your project plan allows it.
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024;

const BUCKET = "deliverables";

function extFromName(name) {
  const idx = (name || "").lastIndexOf(".");
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : "mp4";
}

function uuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function validateVideoFiles(files) {
  if (!files || files.length === 0) {
    return "Pick at least one video.";
  }
  if (files.length > MAX_VIDEOS_PER_SUBMISSION) {
    return `You can submit up to ${MAX_VIDEOS_PER_SUBMISSION} videos at a time.`;
  }
  for (const f of files) {
    if (!ALLOWED_VIDEO_MIME.includes(f.type)) {
      return `Unsupported file type: ${f.name}. Use mp4, mov, m4v, or webm.`;
    }
    if (f.size > MAX_VIDEO_BYTES) {
      return `${f.name} is too large (max ${Math.round(MAX_VIDEO_BYTES / 1024 / 1024)}MB).`;
    }
  }
  return null;
}

// Upload a single file to the deliverables bucket under
// {conversationId}/{uuid}.{ext}. Returns the storage path.
async function uploadOne({ conversationId, file }) {
  const supabase = createClient();
  const path = `${conversationId}/${uuid()}.${extFromName(file.name)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  return path;
}

// Create a deliverable + child rows + system message in the conversation.
export async function submitDeliverable({
  conversation, // { id, gig_id, brand_id, creator_id }
  files,
  note,
  onProgress, // (uploadedCount, total) => void
}) {
  const validation = validateVideoFiles(files);
  if (validation) throw new Error(validation);

  const supabase = createClient();

  // 1. Insert the deliverable shell first so RLS on storage policies for
  //    deliverable_videos can reference it.
  const { data: deliverable, error: dErr } = await supabase
    .from("deliverables")
    .insert({
      conversation_id: conversation.id,
      gig_id: conversation.gig_id,
      brand_id: conversation.brand_id,
      creator_id: conversation.creator_id,
      status: "submitted",
    })
    .select()
    .single();
  if (dErr) throw dErr;

  // 2. Upload every file.
  const paths = [];
  for (let i = 0; i < files.length; i++) {
    const path = await uploadOne({ conversationId: conversation.id, file: files[i] });
    paths.push({ path, file: files[i], position: i });
    onProgress?.(i + 1, files.length);
  }

  // 3. Insert child rows.
  const { error: vErr } = await supabase.from("deliverable_videos").insert(
    paths.map(({ path, file, position }) => ({
      deliverable_id: deliverable.id,
      storage_path: path,
      position,
      size_bytes: file.size,
      mime_type: file.type,
    })),
  );
  if (vErr) throw vErr;

  // 4. Drop a "deliverable" message into the thread.
  await sendMessage({
    conversationId: conversation.id,
    body: (note || "").trim() || `Submitted ${files.length} video${files.length > 1 ? "s" : ""}.`,
    kind: "deliverable",
    deliverableId: deliverable.id,
  });

  return deliverable;
}

export async function fetchDeliverable(id) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("deliverables")
    .select(
      `id, status, feedback, created_at, conversation_id, creator_id, brand_id, gig_id,
       videos:deliverable_videos ( id, storage_path, position, size_bytes, mime_type )`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  data.videos = (data.videos || []).sort((a, b) => a.position - b.position);
  return data;
}

export async function fetchDeliverablesByIds(ids) {
  if (!ids || ids.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("deliverables")
    .select(
      `id, status, feedback, created_at,
       videos:deliverable_videos ( id, storage_path, position )`,
    )
    .in("id", ids);
  if (error) throw error;
  return (data || []).map((d) => ({
    ...d,
    videos: (d.videos || []).sort((a, b) => a.position - b.position),
  }));
}

// Resolve short-lived signed URLs for a list of storage paths. The bucket
// is private so creators/brands can't deep-link videos.
export async function getSignedVideoUrls(paths, expiresIn = 60 * 60) {
  if (!paths || paths.length === 0) return {};
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, expiresIn);
  if (error) throw error;
  const map = {};
  (data || []).forEach((entry) => {
    map[entry.path] = entry.signedUrl;
  });
  return map;
}

export async function approveDeliverable(id) {
  const supabase = createClient();

  // Read current state first so we don't double-count an already-approved
  // deliverable when the brand clicks "Approve" twice.
  const { data: existing, error: readErr } = await supabase
    .from("deliverables")
    .select("id, status, conversation_id")
    .eq("id", id)
    .maybeSingle();
  if (readErr) throw readErr;
  if (!existing) throw new Error("Submission not found.");

  const wasAlreadyApproved = existing.status === "approved";

  const { error } = await supabase
    .from("deliverables")
    .update({ status: "approved", feedback: null })
    .eq("id", id);
  if (error) throw error;

  // Bump the conversation's videos_completed counter. The release endpoint
  // reads this to decide how much escrow to transfer.
  if (!wasAlreadyApproved && existing.conversation_id) {
    const { data: conv } = await supabase
      .from("conversations")
      .select("videos_completed, total_videos_requested")
      .eq("id", existing.conversation_id)
      .maybeSingle();
    const current = Number(conv?.videos_completed || 0);
    const cap = Number(conv?.total_videos_requested || 1);
    const next = Math.min(cap, current + 1);
    if (next !== current) {
      await supabase
        .from("conversations")
        .update({ videos_completed: next })
        .eq("id", existing.conversation_id);
    }
  }
}

export async function requestRevision(id, feedback) {
  const supabase = createClient();
  const trimmed = (feedback || "").trim();
  if (!trimmed) throw new Error("Add a note so the creator knows what to change.");
  const { error } = await supabase
    .from("deliverables")
    .update({ status: "revision_requested", feedback: trimmed })
    .eq("id", id);
  if (error) throw error;
}
