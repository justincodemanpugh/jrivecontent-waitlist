"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Send,
  Upload,
  X,
  Loader2,
  Users,
  DollarSign,
  Share2,
  Video,
  Check,
  AlertCircle,
  Pencil,
} from "lucide-react";
import { fetchMyCreators } from "@/lib/dashboard/brand/creatorsApi";
import {
  createBrief,
  uploadBriefVideo,
  deleteBriefVideo,
  BRIEF_PLATFORMS,
} from "@/lib/dashboard/brand/briefsApi";

export default function NewBriefForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Form state
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [payPerCreator, setPayPerCreator] = useState("");
  const [platform, setPlatform] = useState("");

  // Creators
  const [creators, setCreators] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loadingCreators, setLoadingCreators] = useState(true);

  // Videos: { id, file, objectUrl, storagePath, uploading, error }
  const [videos, setVideos] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const objectUrlsRef = useRef([]);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // Load creators
  useEffect(() => {
    const load = async () => {
      try {
        const rows = await fetchMyCreators();
        setCreators(rows.filter((c) => c.connectionStatus === "active"));
      } catch (e) {
        console.error("Failed to load creators", e);
      } finally {
        setLoadingCreators(false);
      }
    };
    load();
  }, []);

  // Pre-select creators from URL params
  useEffect(() => {
    const creatorsParam = searchParams?.get("creators");
    if (creatorsParam) {
      const ids = creatorsParam.split(",").filter(Boolean);
      setSelectedIds(new Set(ids));
    }
  }, [searchParams]);

  const toggleCreator = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(creators.map((c) => c.id)));
  const clearSelection = () => setSelectedIds(new Set());

  // Video upload
  const handleFiles = useCallback(async (files) => {
    const videoFiles = Array.from(files).filter((f) =>
      f.type.startsWith("video/")
    );

    for (const file of videoFiles) {
      const tempId = crypto.randomUUID();
      const objectUrl = URL.createObjectURL(file);
      objectUrlsRef.current.push(objectUrl);

      setVideos((prev) => [
        ...prev,
        { id: tempId, file, objectUrl, storagePath: null, uploading: true, error: null },
      ]);

      try {
        const result = await uploadBriefVideo(file);
        setVideos((prev) =>
          prev.map((v) =>
            v.id === tempId
              ? { ...v, storagePath: result.storagePath, uploading: false }
              : v
          )
        );
      } catch (e) {
        setVideos((prev) =>
          prev.map((v) =>
            v.id === tempId
              ? { ...v, uploading: false, error: e.message || "Upload failed" }
              : v
          )
        );
      }
    }
  }, []);

  const removeVideo = async (video) => {
    if (video.storagePath) {
      try {
        await deleteBriefVideo(video.storagePath);
      } catch (e) {
        console.error("Failed to delete video", e);
      }
    }
    setVideos((prev) => prev.filter((v) => v.id !== video.id));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Please enter a title for your brief.");
      return;
    }
    if (selectedIds.size === 0) {
      setError("Please select at least one creator.");
      return;
    }

    const uploadedVideos = videos.filter((v) => v.storagePath && !v.error);

    setSubmitting(true);
    try {
      await createBrief({
        title: title.trim(),
        instructions: instructions.trim(),
        payPerCreator: payPerCreator ? parseFloat(payPerCreator) : null,
        platform: platform || null,
        exampleVideos: uploadedVideos.map((v, i) => ({
          storagePath: v.storagePath,
          position: i,
          sizeBytes: v.file?.size,
          mimeType: v.file?.type,
        })),
        recipientIds: Array.from(selectedIds),
      });

      router.push("/dashboard/brand/briefs?sent=1");
    } catch (e) {
      setError(e.message || "Failed to send brief.");
    } finally {
      setSubmitting(false);
    }
  };

  const uploadingCount = videos.filter((v) => v.uploading).length;
  const canSubmit =
    title.trim() && selectedIds.size > 0 && uploadingCount === 0 && !submitting;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-brand-ink">
          Create a Brief
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Describe the video you want and send it to your creators.
        </p>
      </div>

      {/* Section 1 — Brief Details */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-brand-ink flex items-center gap-2">
            <Pencil size={15} className="text-brand-skyDeep" />
            Brief Details
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Give your brief a clear name and describe exactly what you want.
          </p>
        </div>

        <label className="block">
          <span className="text-xs font-medium text-slate-700">
            What's this brief? <span className="text-rose-500">*</span>
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Summer launch video"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-brand-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-skyDeep/20 focus:border-brand-skyDeep"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-slate-700">
            What do you want creators to make?
          </span>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Describe the vibe, key talking points, hashtags, any do's and don'ts…"
            rows={5}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-brand-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-skyDeep/20 focus:border-brand-skyDeep resize-none"
          />
        </label>
      </div>

      {/* Section 2 — Example Videos */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-brand-ink flex items-center gap-2">
            <Video size={15} className="text-brand-skyDeep" />
            Example Videos
            {videos.length > 0 && (
              <span className="ml-1 rounded-full bg-brand-mist text-brand-skyDeep text-xs font-medium px-2 py-0.5">
                {videos.length}
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload videos to show creators the style you're going for.
          </p>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition ${
            dragOver
              ? "border-brand-skyDeep bg-brand-mist/50"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <input
            type="file"
            accept="video/*"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Upload size={22} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-600">
            Drop videos here or{" "}
            <span className="text-brand-skyDeep font-medium">browse</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">MP4, MOV, WebM · up to 100MB each</p>
        </div>

        {/* Thumbnail grid */}
        {videos.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {videos.map((video) => (
              <div
                key={video.id}
                className="group relative w-28 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0"
              >
                {/* Video thumbnail */}
                <video
                  src={video.objectUrl}
                  className="w-full h-full object-cover"
                  muted
                  preload="metadata"
                />

                {/* Upload overlay */}
                {video.uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 size={20} className="animate-spin text-white" />
                  </div>
                )}

                {/* Error overlay */}
                {video.error && (
                  <div className="absolute inset-0 bg-rose-900/60 flex flex-col items-center justify-center gap-1 px-2">
                    <AlertCircle size={16} className="text-white" />
                    <p className="text-[10px] text-white text-center leading-tight">
                      Upload failed
                    </p>
                  </div>
                )}

                {/* Done badge */}
                {!video.uploading && !video.error && (
                  <span className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
                    <Check size={11} className="text-white" strokeWidth={3} />
                  </span>
                )}

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeVideo(video)}
                  className="absolute top-1.5 left-1.5 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-black/80"
                >
                  <X size={11} strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 3 — Pay & Platform */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-brand-ink flex items-center gap-2">
            <DollarSign size={15} className="text-brand-skyDeep" />
            Pay &amp; Platform
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Set how much you'll pay and where creators should post.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Payment */}
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1.5">
              Pay per video
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none">
                $
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={payPerCreator}
                onChange={(e) => setPayPerCreator(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-200 pl-8 pr-4 py-3 text-sm text-brand-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-skyDeep/20 focus:border-brand-skyDeep"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              Creators see this upfront. 15% platform fee applies at payout.
            </p>
          </div>

          {/* Platform */}
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1.5">
              Target platform
            </label>
            <div className="flex flex-wrap gap-2">
              {BRIEF_PLATFORMS.map((p) => {
                const selected = platform === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPlatform(selected ? "" : p.key)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                      selected
                        ? "border-brand-skyDeep bg-brand-mist/60 text-brand-ink"
                        : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Section 4 — Select Creators */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-brand-ink flex items-center gap-2">
              <Users size={15} className="text-brand-skyDeep" />
              Select Creators <span className="text-rose-500">*</span>
              {selectedIds.size > 0 && (
                <span className="ml-1 text-xs font-medium text-slate-400">
                  {selectedIds.size} selected
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose which creators will receive this brief.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs flex-shrink-0 pt-0.5">
            <button
              type="button"
              onClick={selectAll}
              className="text-brand-skyDeep hover:underline underline-offset-2"
            >
              Select all
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-slate-500 hover:underline underline-offset-2"
            >
              Clear
            </button>
          </div>
        </div>

        {loadingCreators ? (
          <div className="flex items-center justify-center py-10 text-slate-300">
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : creators.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center">
            <div className="mx-auto h-12 w-12 rounded-xl bg-brand-mist flex items-center justify-center mb-3">
              <Users size={20} className="text-brand-skyDeep" />
            </div>
            <p className="text-sm font-medium text-brand-ink">No connected creators yet</p>
            <p className="text-xs text-slate-400 mt-1 mb-3">
              Connect with creators before sending a brief.
            </p>
            <a
              href="/dashboard/brand/creators"
              className="text-sm text-brand-skyDeep hover:underline underline-offset-2"
            >
              Browse creators →
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {creators.map((c) => {
              const selected = selectedIds.has(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCreator(c.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition text-left ${
                    selected
                      ? "border-brand-skyDeep bg-brand-mist/60"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {/* Avatar */}
                  {c.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.avatarUrl}
                      alt={c.name}
                      className="h-9 w-9 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <span className="h-9 w-9 rounded-full bg-brand-mist text-brand-skyDeep flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {c.name?.slice(0, 2).toUpperCase() || "?"}
                    </span>
                  )}

                  {/* Name / handle */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-brand-ink truncate leading-tight">
                      {c.name}
                    </p>
                    {c.handle && (
                      <p className="text-xs text-slate-400 truncate">@{c.handle}</p>
                    )}
                  </div>

                  {/* Checkmark */}
                  {selected && (
                    <Check size={15} className="text-brand-skyDeep flex-shrink-0" strokeWidth={2.5} />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 rounded-full bg-brand-ink text-white px-6 py-2.5 text-sm font-medium hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {submitting ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Send size={15} />
              Send Brief
            </>
          )}
        </button>
      </div>
    </form>
  );
}
