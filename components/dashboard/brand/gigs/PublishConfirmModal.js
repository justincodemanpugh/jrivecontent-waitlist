"use client";

import { useEffect, useState } from "react";
import { X, Lock, Rocket, Loader2 } from "lucide-react";

/**
 * Confirmation shown right before a gig is published. Published gigs are
 * immutable — this is the moment we tell the brand so they can't silently
 * change pay or deadlines on creators later.
 */
export default function PublishConfirmModal({ open, form, onConfirm, onClose, publishing = false, error = "" }) {
  const [ack, setAck] = useState(false);

  useEffect(() => {
    if (!open) {
      setAck(false);
      return;
    }
    const esc = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-scrim/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
        <div className="flex items-start justify-between gap-4 px-5 pt-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-warn-soft text-warn">
              <Lock size={15} />
            </span>
            <h2 className="text-base font-semibold text-ink">
              Publish this gig?
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-surface-hover"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4 text-sm text-muted">
          <p>
            Once published, the details below are{" "}
            <span className="font-semibold text-ink">locked</span>. You
            won&apos;t be able to change the pay, description, or example
            videos. Creators rely on this — it&apos;s how jRive keeps gigs
            honest.
          </p>

          <div className="divide-y divide-line rounded-xl border border-line bg-surface-sunken/60">
            <SummaryRow label="Job title" value={form?.title} />
            <SummaryRow label="Pay per video" value={`$${form?.payPerVideo || 0}`} />
            <SummaryRow
              label="Example videos"
              value={
                form?.examples?.length
                  ? `${form.examples.length} attached`
                  : "None"
              }
            />
          </div>

          <label className="flex cursor-pointer items-start gap-2 rounded-lg bg-surface-sunken p-3 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={ack}
              onChange={(e) => setAck(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-line-strong text-accent focus:ring-accent-soft"
            />
            <span>
              I understand this gig can&apos;t be edited after publishing.
            </span>
          </label>
        </div>

        {error && (
          <p className="mx-5 mb-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-line bg-surface px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={publishing}
            className="rounded-full px-4 py-2 text-sm font-medium text-muted transition hover:bg-surface-hover disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!ack || publishing}
            onClick={onConfirm}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-on-accent shadow-sm transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            {publishing ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Rocket size={15} />
            )}
            {publishing ? "Publishing…" : "Publish gig"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-faint">
        {label}
      </p>
      <p className="max-w-[60%] truncate text-sm font-medium text-ink">
        {value || "—"}
      </p>
    </div>
  );
}
