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
    add({ type: "file", value: file.name, name: file.name });
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
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <span className="h-9 w-9 rounded-lg bg-brand-mist text-brand-skyDeep flex items-center justify-center shrink-0">
                {ex.type === "url" ? <Link2 size={16} /> : <Video size={16} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-brand-ink truncate">
                  {ex.value}
                </p>
                <p className="text-xs text-slate-500 capitalize">
                  {ex.type === "url" ? "Link" : "Uploaded video"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Remove"
                className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center"
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
            <label className="block text-sm font-medium text-brand-ink mb-1.5">
              Paste a TikTok, Reel, or YouTube link
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
                placeholder="https://www.tiktok.com/@user/video/..."
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand-skyDeep focus:ring-2 focus:ring-brand-sky/30 outline-none transition"
              />
              <button
                type="button"
                onClick={addUrl}
                disabled={!url.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-ink text-white px-4 text-sm font-medium hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <Plus size={16} />
                Add
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex-1 h-px bg-slate-200" />
            or
            <span className="flex-1 h-px bg-slate-200" />
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
              className="w-full rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-sky hover:bg-brand-mist/40 transition flex items-center justify-center gap-2 py-5 text-sm font-medium text-brand-ink"
            >
              <Upload size={16} className="text-brand-skyDeep" />
              Upload a video file
            </button>
          </div>
        </>
      )}

      <p className="text-xs text-slate-400">
        {form.examples.length}/{MAX_EXAMPLES} added
      </p>
    </StepShell>
  );
}
