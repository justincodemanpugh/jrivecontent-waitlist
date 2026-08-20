"use client";

import { useRef, useState } from "react";
import { Link2, Upload, X, Plus, Video } from "lucide-react";
import StepShell from "./StepShell";
import { MAX_EXAMPLES } from "@/lib/dashboard/brand/gigForm";

export default function StepExamples({ form, update }) {
  const [url, setUrl] = useState("");
  const fileRef = useRef(null);

  const add = (item) => {
    if (form.examples.length >= MAX_EXAMPLES) return;
    update({ examples: [...form.examples, item] });
  };

  const remove = (i) => {
    update({ examples: form.examples.filter((_, idx) => idx !== i) });
  };

  const addUrl = () => {
    const v = url.trim();
    if (!v) return;
    add({ type: "url", value: v });
    setUrl("");
  };

  const onFile = (file) => {
    if (!file) return;
    // Keep the actual File so we can upload it on publish. `previewUrl` lets
    // the review step + this list show a playable thumbnail before publish.
    const previewUrl =
      typeof URL !== "undefined" && URL.createObjectURL
        ? URL.createObjectURL(file)
        : "";
    add({
      type: "file",
      value: file.name,
      name: file.name,
      file,
      previewUrl,
    });
  };

  const atCap = form.examples.length >= MAX_EXAMPLES;

  return (
    <StepShell
      title="Share example videos"
      subtitle={`Optional but highly recommended. Add up to ${MAX_EXAMPLES} references so creators nail your style.`}
    >
      {/* Existing examples */}
      {form.examples.length > 0 && (
        <ul className="space-y-2">
          {form.examples.map((ex, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3"
            >
              <span className="h-9 w-9 rounded-lg bg-accent-tint text-accent flex items-center justify-center shrink-0">
                {ex.type === "url" ? <Link2 size={16} /> : <Video size={16} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink truncate">
                  {ex.value}
                </p>
                <p className="text-xs text-muted capitalize">
                  {ex.type === "url" ? "Link" : "Uploaded video"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Remove"
                className="h-8 w-8 rounded-full hover:bg-surface-hover text-muted flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {!atCap && (
        <>
          {/* URL input */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Paste a TikTok, Reel, or YouTube link
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
                placeholder="https://www.tiktok.com/@user/video/..."
                className="flex-1 rounded-xl border border-line bg-surface px-4 py-3 text-sm focus:border-accent focus:ring-2 focus:ring-accent-soft/30 outline-none transition"
              />
              <button
                type="button"
                onClick={addUrl}
                disabled={!url.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-ink text-on-accent px-4 text-sm font-medium hover:bg-ink/90 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <Plus size={16} />
                Add
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 text-xs text-faint">
            <span className="flex-1 h-px bg-surface-hover" />
            or
            <span className="flex-1 h-px bg-surface-hover" />
          </div>

          {/* Upload */}
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-line hover:border-accent-soft hover:bg-accent-tint/40 transition flex items-center justify-center gap-2 py-5 text-sm font-medium text-ink"
            >
              <Upload size={16} className="text-accent" />
              Upload a video file
            </button>
          </div>
        </>
      )}

      <p className="text-xs text-faint">
        {form.examples.length}/{MAX_EXAMPLES} added
      </p>
    </StepShell>
  );
}
