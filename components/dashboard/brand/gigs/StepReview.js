"use client";

import { useState } from "react";
import { Eye, Edit3, CheckCircle2 } from "lucide-react";
import StepShell from "./StepShell";
import GigPreviewCard from "./GigPreviewCard";
import {
  platformLabel,
  contentTypeLabel,
  usageRightLabel,
  USAGE_RIGHTS,
} from "@/lib/dashboard/brand/gigForm";

export default function StepReview({ form, goToStep }) {
  const [mode, setMode] = useState("summary"); // "summary" | "creator"

  return (
    <StepShell
      title="Review & launch"
      subtitle="This is exactly what creators will see. Edit anything before you publish."
    >
      {/* Mode toggle */}
      <div className="inline-flex rounded-full bg-surface-hover p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("summary")}
          className={[
            "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-medium transition",
            mode === "summary"
              ? "bg-surface text-ink shadow-sm"
              : "text-muted hover:text-ink",
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
              ? "bg-surface text-ink shadow-sm"
              : "text-muted hover:text-ink",
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
        <div className="divide-y divide-line rounded-xl border border-line bg-surface">
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
            label="Videos"
            value={`${form.videoQuantity} video${
              Number(form.videoQuantity) === 1 ? "" : "s"
            }`}
            onEdit={() => goToStep(1)}
          />
          <ReviewRow
            label="Platforms"
            value={
              form.platforms?.length
                ? form.platforms.map(platformLabel).join(", ")
                : "—"
            }
            onEdit={() => goToStep(1)}
          />
          <ReviewRow
            label="Content type"
            value={form.contentType ? contentTypeLabel(form.contentType) : "—"}
            onEdit={() => goToStep(1)}
          />
          <ReviewRow
            label="Usage rights"
            value={
              form.usageRights?.length >= USAGE_RIGHTS.length
                ? "Full rights (all usage types)"
                : form.usageRights?.length
                ? form.usageRights.map(usageRightLabel).join(", ")
                : "—"
            }
            onEdit={() => goToStep(2)}
          />
          <ReviewRow
            label="Pay per video"
            value={`$${form.payPerVideo}`}
            onEdit={() => goToStep(3)}
          />
          <ReviewRow
            label="Example videos"
            value={
              form.examples.length
                ? `${form.examples.length} added`
                : "None"
            }
            onEdit={() => goToStep(4)}
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
        <p className="text-xs font-semibold uppercase tracking-wide text-faint">
          {label}
        </p>
        <p
          className={[
            "mt-1 text-sm text-ink",
            multiline ? "whitespace-pre-wrap" : "truncate",
          ].join(" ")}
        >
          {value || "—"}
        </p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-ink transition"
      >
        <Edit3 size={13} />
        Edit
      </button>
    </div>
  );
}
