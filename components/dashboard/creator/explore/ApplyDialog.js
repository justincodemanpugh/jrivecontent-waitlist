"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Send } from "lucide-react";
import { applyToGig } from "@/lib/dashboard/applicationsApi";

const PITCH_LIMIT = 600;

export default function ApplyDialog({ open, gig, onClose, onApplied }) {
  const [pitch, setPitch] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) {
      setPitch("");
      setBusy(false);
      setErr("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const esc = (e) => e.key === "Escape" && !busy && onClose?.();
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [open, busy, onClose]);

  if (!open || !gig) return null;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const application = await applyToGig({
        gigId: gig.id,
        brandId: gig.brandId,
        pitch,
      });
      onApplied?.(application);
      onClose?.();
    } catch (e2) {
      setErr(e2.message || "Couldn't submit application.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-scrim/40 backdrop-blur-sm"
        onClick={() => !busy && onClose?.()}
      />
      <form
        onSubmit={submit}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-surface shadow-xl border border-line"
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5">
          <div>
            <h2 className="text-base font-semibold text-ink">
              Apply to {gig.title}
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {gig.brandName} · ${gig.payPerVideo}/video
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-hover transition"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 pb-5 pt-3 space-y-3">
          <label className="block text-sm font-medium text-ink">
            Why are you a fit?
          </label>
          <textarea
            value={pitch}
            onChange={(e) => setPitch(e.target.value.slice(0, PITCH_LIMIT))}
            rows={6}
            disabled={busy}
            placeholder="Briefly tell the brand why you're a great match — relevant niches, recent work, ideas for the gig…"
            className="w-full rounded-xl border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft/30 disabled:opacity-60"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted">
              Optional but strongly recommended.
            </p>
            <span className="text-xs text-faint">
              {pitch.length}/{PITCH_LIMIT}
            </span>
          </div>
          {err ? (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
              {err}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line bg-surface-sunken/60 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-full px-4 py-2 text-sm font-medium text-muted hover:bg-surface-hover disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-on-accent hover:bg-ink/90 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            Send application
          </button>
        </div>
      </form>
    </div>
  );
}
