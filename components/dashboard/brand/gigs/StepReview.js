"use client";

import { useState } from "react";
import { Eye, Edit3, CheckCircle2 } from "lucide-react";
import StepShell from "./StepShell";
import GigPreviewCard from "./GigPreviewCard";

export default function StepReview({ form, goToStep }) {
  const [mode, setMode] = useState("summary"); // "summary" | "creator"

  return (
    <StepShell
      title="Review & launch"
      subtitle="This is exactly what creators will see. Edit anything before you publish."
    >
      {/* Mode toggle */}
      <div className="inline-flex rounded-full bg-slate-100 p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("summary")}
          className={[
            "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-medium transition",
            mode === "summary"
              ? "bg-white text-brand-ink shadow-sm"
              : "text-slate-500 hover:text-brand-ink",
          ].join(" ")}
        >
          <CheckCircle2 size={14} />
          Summary
        </button>
        <button
          type="button"
          onClick={() => setMode("creator")}
          className={[
            "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-medium transition",
            mode === "creator"
              ? "bg-white text-brand-ink shadow-sm"
              : "text-slate-500 hover:text-brand-ink",
          ].join(" ")}
        >
          <Eye size={14} />
          Preview as creator
        </button>
      </div>

      {mode === "creator" ? (
        <div className="max-w-md">
          <GigPreviewCard form={form} />
        </div>
      ) : (
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          <ReviewRow
            label="Job title"
            value={form.title}
            onEdit={() => goToStep(0)}
          />
          <ReviewRow
            label="Description"
            value={form.description}
            onEdit={() => goToStep(0)}
            multiline
          />
          <ReviewRow
            label="Cover image"
            value={form.image?.name || "—"}
            onEdit={() => goToStep(0)}
          />
          <ReviewRow
            label="Pay per video"
            value={`$${form.payPerVideo}`}
            onEdit={() => goToStep(1)}
          />
          <ReviewRow
            label="Example videos"
            value={
              form.examples.length
                ? `${form.examples.length} added`
                : "None"
            }
            onEdit={() => goToStep(2)}
          />
        </div>
      )}
    </StepShell>
  );
}

function ReviewRow({ label, value, onEdit, multiline }) {
  return (
    <div className="flex items-start justify-between gap-4 p-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p
          className={[
            "mt-1 text-sm text-brand-ink",
            multiline ? "whitespace-pre-wrap" : "truncate",
          ].join(" ")}
        >
          {value || "—"}
        </p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-brand-skyDeep hover:text-brand-ink transition"
      >
        <Edit3 size={13} />
        Edit
      </button>
    </div>
  );
}
