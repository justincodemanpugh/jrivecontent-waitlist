"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { setCreatorCoverUrl } from "@/lib/dashboard/creator/profileActions";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ACCEPT = "image/png,image/jpeg,image/webp";

export default function CoverPhotoUploader({ userId, initialUrl }) {
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
      setError("Image must be under 8 MB.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${userId}/cover-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("creator-covers")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage
        .from("creator-covers")
        .getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      const res = await setCreatorCoverUrl(publicUrl);
      if (!res.ok) throw new Error(res.error || "Could not save cover photo.");

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
      const res = await setCreatorCoverUrl("");
      if (!res.ok) throw new Error(res.error || "Could not remove cover.");
      setUrl(null);
      router.refresh();
    } catch (e) {
      setError(e.message || "Remove failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="text-sm font-medium text-brand-ink mb-2">Cover photo</p>
      <div className="relative aspect-[9/16] max-w-xs rounded-2xl overflow-hidden border border-slate-200 bg-gradient-to-br from-brand-mist to-slate-100">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="Cover"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
            <ImagePlus size={28} />
            <p className="mt-1 text-xs">No cover yet</p>
          </div>
        )}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur px-3 py-1.5 text-xs font-semibold text-slate-700 shadow hover:bg-white disabled:opacity-50"
        >
          {busy ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <ImagePlus size={12} />
          )}
          {url ? "Replace" : "Upload"}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          PNG, JPG, or WebP. Max 8 MB. Portrait 9:16 (a normal phone photo works).
        </p>
        {url ? (
          <button
            type="button"
            onClick={handleRemove}
            disabled={busy}
            className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            <Trash2 size={12} /> Remove
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
