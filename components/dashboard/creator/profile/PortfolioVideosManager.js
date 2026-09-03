"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, ImagePlus, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PlatformLogo, PLATFORM_LABELS } from "@/components/icons/PlatformLogos";
import {
  addPortfolioVideo,
  deletePortfolioVideo,
} from "@/lib/dashboard/creator/profileActions";

const MAX_VIDEOS = 3;
const MAX_THUMB_BYTES = 8 * 1024 * 1024; // 8 MB
const THUMB_ACCEPT = "image/png,image/jpeg,image/webp";
const PLATFORM_PLACEHOLDERS = {
  instagram: "https://instagram.com/reel/...",
  tiktok: "https://tiktok.com/@you/video/...",
  youtube: "https://youtube.com/shorts/...",
};

function isHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function PortfolioVideosManager({ userId, initialVideos }) {
  const router = useRouter();
  const thumbInputRef = useRef(null);
  const [videos, setVideos] = useState(initialVideos || []);
  const [platform, setPlatform] = useState("instagram");
  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("");
  const [thumbFile, setThumbFile] = useState(null);
  const [thumbPreview, setThumbPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pendingDelete, startDelete] = useTransition();

  const remaining = MAX_VIDEOS - videos.length;
  const hasLegacy = videos.some((v) => v.storage_path && !v.video_url);

  function publicUrl(path) {
    const supabase = createClient();
    const { data } = supabase.storage.from("creator-portfolio").getPublicUrl(path);
    return data.publicUrl;
  }

  function resetForm() {
    setPlatform("instagram");
    setVideoUrl("");
    setTitle("");
    setThumbFile(null);
    setThumbPreview("");
    if (thumbInputRef.current) thumbInputRef.current.value = "";
  }

  function handleThumbSelect(file) {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Thumbnail must be an image (PNG, JPG, or WebP).");
      return;
    }
    if (file.size > MAX_THUMB_BYTES) {
      setError("Thumbnail must be under 8 MB.");
      return;
    }
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  }

  async function handleAddVideo() {
    setError("");
    if (videos.length >= MAX_VIDEOS) {
      setError(`You can add at most ${MAX_VIDEOS} videos.`);
      return;
    }
    if (!isHttpUrl(videoUrl)) {
      setError("Please enter a valid video link.");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      let thumbnail_path = null;

      if (thumbFile) {
        const ext = (thumbFile.name.split(".").pop() || "jpg").toLowerCase();
        const path = `${userId}/thumb-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("creator-portfolio")
          .upload(path, thumbFile, { contentType: thumbFile.type, upsert: false });
        if (upErr) throw upErr;
        thumbnail_path = path;
      }

      const res = await addPortfolioVideo({
        platform,
        video_url: videoUrl.trim(),
        thumbnail_path,
        title: title.trim(),
      });
      if (!res.ok) {
        if (thumbnail_path) {
          await supabase.storage.from("creator-portfolio").remove([thumbnail_path]);
        }
        throw new Error(res.error || "Could not add video.");
      }

      setVideos((prev) => [...prev, res.video]);
      resetForm();
      router.refresh();
    } catch (e) {
      setError(e.message || "Could not add video.");
    } finally {
      setSaving(false);
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
    <div className="rounded-2xl border border-line bg-surface p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">Top performing videos</h3>
          <p className="text-xs text-muted mt-0.5">
            Link up to {MAX_VIDEOS} of your best posts from Instagram, TikTok, or
            YouTube. Add a thumbnail so brands can preview each one.
          </p>
        </div>
        <span className="text-xs text-muted shrink-0">
          {videos.length}/{MAX_VIDEOS}
        </span>
      </div>

      {hasLegacy ? (
        <div className="rounded-xl border border-warn-line bg-warn-soft px-4 py-3 text-xs text-warn">
          We&apos;ve switched to linking your best posts. Your older uploaded
          videos still show below — we recommend deleting them and re-adding
          them as links to your live posts.
        </div>
      ) : null}

      {videos.length > 0 ? (
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {videos.map((v) => {
            const isLink = Boolean(v.video_url);
            return (
              <li
                key={v.id}
                className="relative rounded-xl overflow-hidden border border-line bg-surface-hover aspect-[9/16] group"
              >
                {isLink ? (
                  v.thumbnail_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={publicUrl(v.thumbnail_path)}
                      alt={v.title || "Video thumbnail"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-surface-hover">
                      <PlatformLogo platform={v.platform} size={40} />
                    </div>
                  )
                ) : (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video
                    src={publicUrl(v.storage_path)}
                    className="h-full w-full object-cover"
                    controls
                    preload="metadata"
                    playsInline
                  />
                )}

                {isLink ? (
                  <a
                    href={v.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex flex-col justify-end p-2 bg-gradient-to-t from-black/70 via-transparent to-transparent"
                  >
                    <span className="flex items-center gap-1.5 text-white text-xs font-medium">
                      <PlatformLogo platform={v.platform} size={16} />
                      <span className="truncate">{v.title || PLATFORM_LABELS[v.platform]}</span>
                      <ExternalLink size={12} className="ml-auto shrink-0" />
                    </span>
                  </a>
                ) : null}

                <button
                  type="button"
                  onClick={() => handleDelete(v.id)}
                  disabled={pendingDelete}
                  aria-label="Delete video"
                  className="absolute top-2 right-2 z-10 h-7 w-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center disabled:opacity-50"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {remaining > 0 ? (
        <div className="rounded-xl border border-line bg-surface-sunken/60 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-medium text-ink-soft mb-1">Platform</label>
              <div className="grid grid-cols-3 gap-1.5">
                {["instagram", "tiktok", "youtube"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlatform(p)}
                    aria-label={PLATFORM_LABELS[p]}
                    className={`flex items-center justify-center rounded-lg border py-2 transition ${
                      platform === p
                        ? "border-accent bg-surface ring-2 ring-accent-soft/30"
                        : "border-line bg-surface hover:border-line-strong"
                    }`}
                  >
                    <PlatformLogo platform={p} size={20} />
                  </button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-ink-soft mb-1">Video link</label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder={PLATFORM_PLACEHOLDERS[platform]}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. My top performing reel"
              maxLength={100}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft/30"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => thumbInputRef.current?.click()}
              className="relative h-20 w-12 shrink-0 rounded-lg border border-dashed border-line-strong bg-surface overflow-hidden flex items-center justify-center text-faint hover:border-accent"
            >
              {thumbPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbPreview} alt="Thumbnail preview" className="h-full w-full object-cover" />
              ) : (
                <ImagePlus size={16} />
              )}
            </button>
            <div className="text-xs text-muted">
              <p className="font-medium text-ink">Thumbnail (recommended)</p>
              <p>A 9:16 image works best. PNG, JPG, or WebP up to 8 MB.</p>
            </div>
            <input
              ref={thumbInputRef}
              type="file"
              accept={THUMB_ACCEPT}
              className="hidden"
              onChange={(e) => handleThumbSelect(e.target.files?.[0])}
            />
          </div>

          <button
            type="button"
            onClick={handleAddVideo}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-on-accent transition hover:bg-accent/90 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {saving ? "Adding…" : "Add video"}
          </button>
        </div>
      ) : (
        <div className="rounded-xl bg-surface-sunken border border-line px-4 py-3 text-xs text-muted">
          You&apos;ve reached the {MAX_VIDEOS}-video limit. Delete one to add another.
        </div>
      )}

      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
