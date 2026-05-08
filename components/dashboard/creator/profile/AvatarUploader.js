"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { setCreatorAvatarUrl } from "@/lib/dashboard/creator/profileActions";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

export default function AvatarUploader({ userId, initialUrl, initials }) {
  const router = useRouter();
  const inputRef = useRef(null);
  const [url, setUrl] = useState(initialUrl || null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file) {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be under 5 MB.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const path = `${userId}/${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      const res = await setCreatorAvatarUrl(publicUrl);
      if (!res.ok) throw new Error(res.error || "Could not save avatar.");

      setUrl(publicUrl);
      router.refresh();
    } catch (e) {
      setError(e.message || "Upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    setBusy(true);
    setError("");
    try {
      const res = await setCreatorAvatarUrl("");
      if (!res.ok) throw new Error(res.error || "Could not remove avatar.");
      setUrl(null);
      router.refresh();
    } catch (e) {
      setError(e.message || "Remove failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <div className="h-20 w-20 rounded-full overflow-hidden bg-brand-sky text-white text-2xl font-semibold flex items-center justify-center ring-2 ring-white shadow-sm">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt="Avatar"
              className="h-full w-full object-cover"
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          aria-label="Change photo"
          className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Pencil size={14} />}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      <div className="flex flex-col gap-1 min-w-0">
        <p className="text-sm font-medium text-brand-ink">Profile photo</p>
        <p className="text-xs text-slate-500">
          PNG, JPG, GIF, or WebP. Max 5 MB. Auto-cropped to a circle.
        </p>
        {url ? (
          <button
            type="button"
            onClick={handleRemove}
            disabled={busy}
            className="self-start mt-1 inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            <Trash2 size={12} /> Remove photo
          </button>
        ) : null}
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
