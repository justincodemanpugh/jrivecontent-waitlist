"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, Trash2, Loader2, Video as VideoIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  addPortfolioVideo,
  deletePortfolioVideo,
} from "@/lib/dashboard/creator/profileActions";

const MAX_VIDEOS = 3;
const MAX_BYTES = 200 * 1024 * 1024; // 200 MB
const ACCEPT = "video/mp4,video/quicktime,video/webm,video/x-m4v,video/*";

export default function PortfolioVideosManager({ userId, initialVideos }) {
  const router = useRouter();
  const inputRef = useRef(null);
  const [videos, setVideos] = useState(initialVideos || []);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [pendingDelete, startDelete] = useTransition();

  const remaining = MAX_VIDEOS - videos.length;

  function publicUrl(path) {
    const supabase = createClient();
    const { data } = supabase.storage.from("creator-portfolio").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleFile(file) {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setError("Please choose a video file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Video must be under 200 MB.");
      return;
    }
    if (videos.length >= MAX_VIDEOS) {
      setError(`You can upload at most ${MAX_VIDEOS} videos.`);
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("creator-portfolio")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const res = await addPortfolioVideo({
        storage_path: path,
        mime_type: file.type,
        size_bytes: file.size,
      });
      if (!res.ok) {
        // Best-effort cleanup if DB row failed.
        await supabase.storage.from("creator-portfolio").remove([path]);
        throw new Error(res.error || "Upload failed.");
      }

      setVideos((prev) => [...prev, res.video]);
      router.refresh();
    } catch (e) {
      setError(e.message || "Upload failed.");
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleDelete(id) {
    setError("");
    startDelete(async () => {
      const res = await deletePortfolioVideo(id);
      if (!res.ok) {
        setError(res.error || "Could not delete video.");
        return;
      }
      setVideos((prev) => prev.filter((v) => v.id !== id));
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-brand-ink">Showcase your work</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload up to {MAX_VIDEOS} short videos (TikTok-style). MP4, MOV, or WebM. Max 200 MB each.
          </p>
        </div>
        <span className="text-xs text-slate-500 shrink-0">
          {videos.length}/{MAX_VIDEOS}
        </span>
      </div>

      {videos.length > 0 ? (
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {videos.map((v) => (
            <li
              key={v.id}
              className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-[9/16] group"
            >
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                src={publicUrl(v.storage_path)}
                className="h-full w-full object-cover"
                controls
                preload="metadata"
                playsInline
              />
              <button
                type="button"
                onClick={() => handleDelete(v.id)}
                disabled={pendingDelete}
                aria-label="Delete video"
                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center disabled:opacity-50"
              >
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {remaining > 0 ? (
        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 hover:bg-slate-50 px-4 py-6 flex flex-col items-center justify-center gap-2 text-sm text-slate-600 disabled:opacity-60"
          >
            {uploading ? (
              <>
                <Loader2 size={18} className="animate-spin text-brand-skyDeep" />
                <span>Uploading…</span>
              </>
            ) : (
              <>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white border border-slate-200 text-brand-skyDeep">
                  <Upload size={16} />
                </span>
                <span className="font-medium text-brand-ink">Upload a video</span>
                <span className="text-xs text-slate-500">
                  {remaining} slot{remaining === 1 ? "" : "s"} remaining
                </span>
              </>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      ) : (
        <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-500 inline-flex items-center gap-2">
          <VideoIcon size={14} /> You&apos;ve reached the {MAX_VIDEOS}-video limit. Delete one to upload another.
        </div>
      )}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
