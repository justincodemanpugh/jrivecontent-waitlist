// Uploads a brand logo / avatar to the public `avatars` Supabase bucket
// and returns its public URL. Files are stored under `{user_id}/...` so the
// existing bucket RLS policies (set up in migration 0006) apply unchanged.
import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export async function uploadBrandAvatar(file) {
  if (!file) throw new Error("No file selected.");
  if (!ALLOWED.includes(file.type)) {
    throw new Error("Please upload a PNG, JPG, WEBP, or GIF.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image is larger than 5 MB.");
  }

  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("You need to be signed in.");

  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  const path = `${user.id}/${id}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("avatars")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
  if (upErr) throw upErr;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data?.publicUrl || null;
}
