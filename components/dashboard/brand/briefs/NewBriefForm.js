"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Send,
  Upload,
  X,
  Loader2,
  Users,
  DollarSign,
  Calendar,
  Video,
  Check,
  AlertCircle,
} from "lucide-react";
import { fetchMyCreators } from "@/lib/dashboard/brand/creatorsApi";
import { createBrief, uploadBriefVideo, deleteBriefVideo } from "@/lib/dashboard/brand/briefsApi";

export default function NewBriefForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Form state
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [payPerCreator, setPayPerCreator] = useState("");
  const [deadline, setDeadline] = useState("");

  // Creators
  const [creators, setCreators] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loadingCreators, setLoadingCreators] = useState(true);

  // Videos
  const [videos, setVideos] = useState([]); // { id, file, storagePath, uploading, error }
  const [dragOver, setDragOver] = useState(false);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Load creators
  useEffect(() => {
    const load = async () => {
      try {
        const rows = await fetchMyCreators();
        // Only show active (connected) creators
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
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(creators.map((c) => c.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Video upload
  const handleFiles = useCallback(async (files) => {
    const videoFiles = Array.from(files).filter((f) =>
      f.type.startsWith("video/")
    );

    for (const file of videoFiles) {
      const tempId = crypto.randomUUID();
      setVideos((prev) => [
        ...prev,
        { id: tempId, file, storagePath: null, uploading: true, error: null },
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
        deadline: deadline || null,
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
          Send New Brief
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Share a content brief with your creators. They'll see your instructions and example videos.
        </p>
      </div>

      {/* Title */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-brand-ink">
            Brief Title <span className="text-rose-500">*</span>
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Summer Collection Launch Video"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-brand-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-skyDeep/20 focus:border-brand-skyDeep"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-brand-ink">
            Instructions
          </span>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Describe what you want creators to make. Include talking points, style guidelines, hashtags, etc."
            rows={5}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-brand-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-skyDeep/20 focus:border-brand-skyDeep resize-none"
          />
        </label>
      </div>

      {/* Example Videos */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-brand-ink flex items-center gap-2">
              <Video size={16} className="text-brand-skyDeep" />
              Example Videos
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload videos to show creators the style you want
            </p>
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
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
          <Upload size={24} className="mx-auto text-slate-400 mb-2" />
          <p className="text-sm text-slate-600">
            Drag & drop videos or{" "}
            <span className="text-brand-skyDeep font-medium">browse</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">MP4, MOV, WebM up to 100MB</p>
        </div>

        {/* Video list */}
        {videos.length > 0 && (
          <div className="space-y-2">
            {videos.map((video) => (
              <div
                key={video.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"
              >
                <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Video size={20} className="text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-ink truncate">
                    {video.file?.name || "Video"}
                  </p>
                  {video.uploading ? (
                    <p className="text-xs text-brand-skyDeep flex items-center gap-1">
                      <Loader2 size={12} className="animate-spin" />
                      Uploading...
                    </p>
                  ) : video.error ? (
                    <p className="text-xs text-rose-600">{video.error}</p>
                  ) : (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <Check size={12} />
                      Uploaded
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeVideo(video)}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment & Deadline */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-brand-ink flex items-center gap-2">
              <DollarSign size={14} className="text-slate-400" />
              Payment per Creator
              <span className="text-xs font-normal text-slate-400">(optional)</span>
            </span>
            <div className="mt-1.5 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
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
          </label>

          <label className="block">
            <span className="text-sm font-medium text-brand-ink flex items-center gap-2">
              <Calendar size={14} className="text-slate-400" />
              Deadline
              <span className="text-xs font-normal text-slate-400">(optional)</span>
            </span>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-brand-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-skyDeep/20 focus:border-brand-skyDeep"
            />
          </label>
        </div>
      </div>

      {/* Select Creators */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-brand-ink flex items-center gap-2">
              <Users size={16} className="text-brand-skyDeep" />
              Select Creators <span className="text-rose-500">*</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose which creators will receive this brief
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={selectAll}
              className="text-brand-skyDeep hover:underline"
            >
              Select all
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-slate-500 hover:underline"
            >
              Clear
            </button>
          </div>
        </div>

        {loadingCreators ? (
          <div className="flex items-center justify-center py-8 text-slate-400">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : creators.length === 0 ? (
          <div className="text-center py-8">
            <Users size={24} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">No connected creators yet.</p>
            <a
              href="/dashboard/brand/creators"
              className="text-sm text-brand-skyDeep hover:underline"
            >
              Browse creators to connect
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {creators.map((c) => {
              const selected = selectedIds.has(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCreator(c.id)}
                  className={`flex items-center gap-2 p-2 rounded-xl border transition text-left ${
                    selected
                      ? "border-brand-skyDeep bg-brand-mist/50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    {c.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.avatarUrl}
                        alt={c.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="h-8 w-8 rounded-full bg-brand-mist text-brand-skyDeep flex items-center justify-center text-xs font-semibold">
                        {c.name?.slice(0, 2).toUpperCase() || "?"}
                      </span>
                    )}
                    {selected && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-brand-skyDeep text-white flex items-center justify-center">
                        <Check size={10} />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-brand-ink truncate">
                      {c.name}
                    </p>
                    {c.handle && (
                      <p className="text-[10px] text-slate-500 truncate">
                        @{c.handle}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {selectedIds.size > 0 && (
          <p className="text-xs text-slate-500">
            {selectedIds.size} creator{selectedIds.size !== 1 ? "s" : ""} selected
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center justify-end gap-3">
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
          className="inline-flex items-center gap-2 rounded-full bg-brand-ink text-white px-6 py-2.5 text-sm font-medium hover:bg-slate-800 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          {submitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
          Send Brief
        </button>
      </div>
    </form>
  );
}
