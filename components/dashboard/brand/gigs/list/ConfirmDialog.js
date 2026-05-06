"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Generic confirm dialog used for Deactivate and Delete flows.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onClose,
}) {
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
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl border border-slate-200">
        <div className="flex items-start justify-between gap-4 px-5 pt-5">
          <h2 className="text-base font-semibold text-brand-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 pb-5 pt-2 text-sm text-slate-600">
          {description}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={[
              "rounded-full px-4 py-2 text-sm font-semibold text-white transition",
              destructive
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-brand-skyDeep hover:bg-brand-ink",
            ].join(" ")}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
