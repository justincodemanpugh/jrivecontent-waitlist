"use client";

import { ArrowLeft, ArrowRight, Rocket } from "lucide-react";

export default function StepNav({
  onBack,
  onNext,
  canGoBack,
  canGoNext,
  isLast,
  onPublish,
}) {
  return (
    <div className="sticky bottom-0 -mx-4 md:mx-0 mt-8 border-t border-line bg-surface/90 backdrop-blur px-4 md:px-6 py-4 flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onBack}
        disabled={!canGoBack}
        className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium text-muted hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {isLast ? (
        <button
          type="button"
          onClick={onPublish}
          disabled={!canGoNext}
          className="inline-flex items-center gap-2 rounded-full bg-accent text-on-accent px-6 py-2.5 text-sm font-semibold hover:bg-ink disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-accent-soft/30"
        >
          <Rocket size={16} />
          Publish gig
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext}
          className="inline-flex items-center gap-1.5 rounded-full bg-ink text-on-accent px-6 py-2.5 text-sm font-semibold hover:bg-ink/90 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Next
          <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}
