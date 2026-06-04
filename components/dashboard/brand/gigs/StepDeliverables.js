"use client";

import { Film, Check } from "lucide-react";
import StepShell from "./StepShell";
import {
  VIDEO_QUANTITY_PRESETS,
  MIN_VIDEO_QUANTITY,
  MAX_VIDEO_QUANTITY,
  PLATFORMS,
  CONTENT_TYPES,
} from "@/lib/dashboard/brand/gigForm";

export default function StepDeliverables({ form, update }) {
  const quantity = form.videoQuantity;
  const isPreset = VIDEO_QUANTITY_PRESETS.includes(Number(quantity));

  const togglePlatform = (key) => {
    const current = Array.isArray(form.platforms) ? form.platforms : [];
    const next = current.includes(key)
      ? current.filter((p) => p !== key)
      : [...current, key];
    update({ platforms: next });
  };

  return (
    <StepShell
      title="What do you need delivered?"
      subtitle="Set the scope so creators know exactly what they're signing up for."
    >
      {/* Video quantity */}
      <div>
        <label className="block text-sm font-medium text-brand-ink mb-1.5">
          How many videos?
        </label>
        <div className="flex flex-wrap gap-2">
          {VIDEO_QUANTITY_PRESETS.map((p) => {
            const active = Number(quantity) === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => update({ videoQuantity: p })}
                className={[
                  "rounded-full px-4 py-2 text-sm font-medium border transition",
                  active
                    ? "bg-brand-ink text-white border-brand-ink"
                    : "bg-white text-brand-ink border-slate-200 hover:border-brand-sky",
                ].join(" ")}
              >
                {p} videos
              </button>
            );
          })}
        </div>
        <div className="mt-3 max-w-[12rem]">
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Or enter a custom amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Film size={16} />
            </span>
            <input
              type="number"
              min={MIN_VIDEO_QUANTITY}
              max={MAX_VIDEO_QUANTITY}
              inputMode="numeric"
              value={quantity}
              onChange={(e) =>
                update({
                  videoQuantity:
                    e.target.value === "" ? "" : Number(e.target.value),
                })
              }
              className={[
                "w-full rounded-xl border bg-white pl-9 pr-4 py-2.5 text-sm font-semibold text-brand-ink outline-none transition focus:ring-2 focus:ring-brand-sky/30",
                !isPreset && quantity !== ""
                  ? "border-brand-skyDeep"
                  : "border-slate-200 focus:border-brand-skyDeep",
              ].join(" ")}
            />
          </div>
        </div>
      </div>

      {/* Platforms */}
      <div>
        <label className="block text-sm font-medium text-brand-ink mb-1.5">
          Where should they post?
        </label>
        <p className="text-xs text-slate-400 mb-2">Pick one or more platforms.</p>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => {
            const active =
              Array.isArray(form.platforms) && form.platforms.includes(p.key);
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => togglePlatform(p.key)}
                className={[
                  "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium border transition",
                  active
                    ? "bg-brand-mist text-brand-skyDeep border-brand-sky"
                    : "bg-white text-brand-ink border-slate-200 hover:border-brand-sky",
                ].join(" ")}
              >
                {active && <Check size={14} />}
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content type */}
      <div>
        <label className="block text-sm font-medium text-brand-ink mb-1.5">
          What type of content?
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CONTENT_TYPES.map((c) => {
            const active = form.contentType === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => update({ contentType: c.key })}
                className={[
                  "rounded-xl px-3 py-2.5 text-sm font-medium border text-center transition",
                  active
                    ? "bg-brand-ink text-white border-brand-ink"
                    : "bg-white text-brand-ink border-slate-200 hover:border-brand-sky",
                ].join(" ")}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>
    </StepShell>
  );
}
