"use client";

import { useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import StepShell from "./StepShell";
import { TITLE_LIMIT, DESCRIPTION_LIMIT } from "@/lib/dashboard/brand/gigForm";

export default function StepJobInfo({ form, update }) {
  const fileRef = useRef(null);

  const onFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      update({ image: { dataUrl: reader.result, name: file.name } });
    reader.readAsDataURL(file);
  };

  const titleCount = form.title.length;
  const descCount = form.description.length;

  return (
    <StepShell
      title="Tell creators about the job"
      subtitle="A clear brief means better videos on the first try."
    >
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">
          Job title
        </label>
        <input
          type="text"
          value={form.title}
          maxLength={TITLE_LIMIT}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="e.g. 30-second unboxing for our new skincare serum"
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent-soft/30 outline-none transition"
        />
        <div className="mt-1 flex justify-between text-xs text-faint">
          <span>Keep it specific — what & why.</span>
          <span>
            {titleCount}/{TITLE_LIMIT}
          </span>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">
          Job description
        </label>
        <textarea
          rows={6}
          value={form.description}
          maxLength={DESCRIPTION_LIMIT}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="Angle, vibe, length, must-have shots, tone of voice…"
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent-soft/30 outline-none transition resize-none"
        />
        <div className="mt-1 flex justify-between text-xs text-faint">
          <span>Min 20 characters.</span>
          <span
            className={
              descCount > DESCRIPTION_LIMIT - 50 ? "text-warn" : ""
            }
          >
            {descCount}/{DESCRIPTION_LIMIT}
          </span>
        </div>
      </div>

      {/* Image */}
      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">
          Cover image
        </label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        {form.image ? (
          <div className="relative rounded-xl border border-line overflow-hidden group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={form.image.dataUrl}
              alt={form.image.name}
              className="w-full h-56 object-cover"
            />
            <button
              type="button"
              onClick={() => update({ image: null })}
              className="absolute top-3 right-3 h-8 w-8 rounded-full bg-surface/90 hover:bg-surface text-ink flex items-center justify-center shadow"
              aria-label="Remove image"
            >
              <X size={16} />
            </button>
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-white text-xs">
              {form.image.name}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-xl border-2 border-dashed border-line hover:border-accent-soft hover:bg-accent-tint/40 transition flex flex-col items-center justify-center py-12 text-muted"
          >
            <span className="h-12 w-12 rounded-full bg-accent-tint text-accent flex items-center justify-center">
              <ImageIcon size={22} />
            </span>
            <span className="mt-3 text-sm font-medium text-ink">
              Drop an image or click to upload
            </span>
            <span className="text-xs mt-1">PNG, JPG up to 10MB</span>
            <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-accent">
              <Upload size={14} />
              Choose file
            </span>
          </button>
        )}
      </div>
    </StepShell>
  );
}
