"use client";

import { useEffect } from "react";
import { X, Lock } from "lucide-react";

export default function ComingSoonModal({ open, title = "Coming soon", onClose }) {
  useEffect(() => {
    if (!open) return;
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
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 px-5 pt-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-mist text-brand-skyDeep">
              <Lock size={15} />
            </span>
            <h2 className="text-base font-semibold text-brand-ink">{title}</h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
          >
            <X size={16} />
          </button>
        </div>

        <p className="px-5 py-4 text-sm text-slate-600">
          We&apos;re still putting the finishing touches on this. Check back
          shortly.
        </p>

        <div className="flex items-center justify-end border-t border-slate-100 bg-white px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-brand-skyDeep px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-ink"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
