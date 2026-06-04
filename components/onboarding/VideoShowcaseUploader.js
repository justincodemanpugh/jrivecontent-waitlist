"use client";

import { useRef, useState } from "react";
import { Plus, Trash2, ExternalLink, Play, ImagePlus, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PlatformLogo, PLATFORM_LABELS } from "@/components/icons/PlatformLogos";

const MAX_VIDEOS = 3;
const MAX_THUMB_BYTES = 8 * 1024 * 1024; // 8 MB
const THUMB_ACCEPT = "image/png,image/jpeg,image/webp";
const PLATFORM_OPTIONS = ["instagram", "tiktok", "youtube"];
const PLATFORM_PLACEHOLDERS = {
  instagram: "https://instagram.com/reel/...",
  tiktok: "https://tiktok.com/@you/video/...",
  youtube: "https://youtube.com/shorts/...",
};

export default function VideoShowcaseUploader({
  userId,
  videos,
  onVideosChange,
  onValidationChange,
}) {
  const thumbInputRef = useRef(null);
  const [newVideo, setNewVideo] = useState({
    platform: "instagram",
    video_url: "",
    title: "",
  });
  const [thumbFile, setThumbFile] = useState(null);
  const [thumbPreview, setThumbPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const isValidUrl = (url) => {
    try {
      const u = new URL(url);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleThumbSelect = (file) => {
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
  };

  const resetForm = () => {
    setNewVideo({ platform: "instagram", video_url: "", title: "" });
    setThumbFile(null);
    setThumbPreview("");
    if (thumbInputRef.current) thumbInputRef.current.value = "";
  };

  const addVideo = async () => {
    setError("");
    if (videos.length >= MAX_VIDEOS) {
      setError(`You can add at most ${MAX_VIDEOS} videos.`);
      return;
    }
    if (!isValidUrl(newVideo.video_url)) {
      setError("Please enter a valid video link.");
      return;
    }

    setUploading(true);
    try {
      let thumbnail_path = null;
      if (thumbFile) {
        const supabase = createClient();
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

      const video = {
        id: Date.now().toString(),
        platform: newVideo.platform,
        video_url: newVideo.video_url.trim(),
        title: newVideo.title.trim() || PLATFORM_LABELS[newVideo.platform],
        thumbnail_path,
      };

      const updatedVideos = [...videos, video];
      onVideosChange(updatedVideos);
      onValidationChange(updatedVideos.length > 0);
      resetForm();
    } catch (e) {
      setError(e.message || "Could not add video.");
    } finally {
      setUploading(false);
    }
  };

  const removeVideo = (id) => {
    const updatedVideos = videos.filter((v) => v.id !== id);
    onVideosChange(updatedVideos);
    onValidationChange(updatedVideos.length > 0);
  };

  const thumbPublicUrl = (path) => {
    const supabase = createClient();
    return supabase.storage.from("creator-portfolio").getPublicUrl(path).data.publicUrl;
  };

  const hasValidVideos = videos.length > 0;
  const canAddVideo =
    !uploading && videos.length < MAX_VIDEOS && isValidUrl(newVideo.video_url);

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-purple-50 border border-purple-200 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
              hasValidVideos ? 'bg-green-500' : 'bg-amber-500'
            }`}>
              {hasValidVideos ? (
                <Play size={12} className="text-white" />
              ) : (
                <div className="w-2 h-2 bg-white rounded-full" />
              )}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-purple-900">
              {hasValidVideos ? "Best videos added!" : "Add your best performing videos"}
            </p>
            <p className="text-xs text-purple-700 mt-1">
              Link up to {MAX_VIDEOS} of your top posts. Add a thumbnail so brands
              can preview each one, then click through to see it on your profile.
            </p>
          </div>
        </div>
      </div>

      {/* Add new video form */}
      {videos.length < MAX_VIDEOS && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
          <h3 className="text-sm font-medium text-brand-ink">Add video</h3>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Platform</label>
            <div className="grid grid-cols-3 gap-2">
              {PLATFORM_OPTIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setNewVideo((prev) => ({ ...prev, platform: p }))}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition ${
                    newVideo.platform === p
                      ? "border-brand-skyDeep bg-white text-brand-ink ring-2 ring-brand-sky/30"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <PlatformLogo platform={p} size={18} />
                  {PLATFORM_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Video link</label>
            <input
              type="url"
              value={newVideo.video_url}
              onChange={(e) => setNewVideo((prev) => ({ ...prev, video_url: e.target.value }))}
              placeholder={PLATFORM_PLACEHOLDERS[newVideo.platform]}
              className={`w-full rounded-lg border px-3 py-2 text-sm text-brand-ink placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-sky/30 ${
                newVideo.video_url && !isValidUrl(newVideo.video_url)
                  ? "border-red-300 focus:border-red-500"
                  : "border-slate-200 focus:border-brand-skyDeep"
              }`}
            />
            {newVideo.video_url && !isValidUrl(newVideo.video_url) && (
              <p className="mt-1 text-xs text-red-600">Please enter a valid URL</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Title (optional)</label>
            <input
              type="text"
              value={newVideo.title}
              onChange={(e) => setNewVideo((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="My best performing video"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-brand-ink placeholder-slate-400 focus:border-brand-skyDeep focus:outline-none focus:ring-2 focus:ring-brand-sky/30"
              maxLength={100}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => thumbInputRef.current?.click()}
              className="relative h-20 w-12 shrink-0 rounded-lg border border-dashed border-slate-300 bg-white overflow-hidden flex items-center justify-center text-slate-400 hover:border-brand-skyDeep"
            >
              {thumbPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbPreview} alt="Thumbnail preview" className="h-full w-full object-cover" />
              ) : (
                <ImagePlus size={16} />
              )}
            </button>
            <div className="text-xs text-slate-500">
              <p className="font-medium text-brand-ink">Thumbnail (recommended)</p>
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

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="button"
            onClick={addVideo}
            disabled={!canAddVideo}
            className="inline-flex items-center gap-2 rounded-full bg-brand-skyDeep px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {uploading ? "Adding…" : "Add video"}
          </button>
        </div>
      )}

      {/* Added videos list */}
      {videos.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-brand-ink">
            Your best videos ({videos.length}/{MAX_VIDEOS})
          </h3>
          {videos.map((video, index) => (
            <div key={video.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-center gap-3">
                <div className="h-16 w-10 shrink-0 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center">
                  {video.thumbnail_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbPublicUrl(video.thumbnail_path)}
                      alt={video.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <PlatformLogo platform={video.platform} size={22} />
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <PlatformLogo platform={video.platform} size={16} />
                    <span className="text-sm font-medium text-brand-ink truncate">{video.title}</span>
                    <span className="text-xs text-slate-400">#{index + 1}</span>
                  </div>
                  <a
                    href={video.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-brand-skyDeep hover:underline"
                  >
                    <ExternalLink size={12} />
                    View original
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => removeVideo(video.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!hasValidVideos && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
          <p className="text-xs text-amber-800">
            <strong>Required:</strong> Add at least one of your best videos to continue.
          </p>
        </div>
      )}
    </div>
  );
}
