"use client";

import { useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

const CONFIRM_PHRASE = "DELETE";

export default function DeleteAccountCard({ role = "creator" }) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setOpen(false);
    setConfirmText("");
    setError("");
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (confirmText !== CONFIRM_PHRASE) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete account.");
      }
      // Hard redirect — clears any in-memory state and forces a fresh load.
      window.location.href = "/?deleted=1";
    } catch (e) {
      setError(e.message || "Failed to delete account.");
      setSubmitting(false);
    }
  };

  const losingItems =
    role === "brand"
      ? [
          "Your brand profile and company details",
          "All gigs you've posted and their applicants",
          "All conversations and messages with creators",
          "All deliverables submitted to you",
        ]
      : [
          "Your creator profile, handle, and portfolio",
          "All gig applications you've submitted",
          "All conversations and messages with brands",
          "All deliverables you've uploaded",
        ];

  return (
    <>
      <section className="rounded-2xl border border-red-200 bg-white p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <AlertTriangle size={18} />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-brand-ink">
              Delete account
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Permanently delete your account and everything associated with
              it. This action cannot be undone.
            </p>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
            >
              <Trash2 size={16} />
              Delete my account
            </button>
          </div>
        </div>
      </section>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between p-5 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <AlertTriangle size={18} />
                </span>
                <h3 className="text-base font-semibold text-brand-ink">
                  Delete your account?
                </h3>
              </div>
              <button
                type="button"
                onClick={reset}
                disabled={submitting}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600">
                This will permanently remove:
              </p>
              <ul className="text-sm text-slate-700 space-y-1.5 pl-4 list-disc">
                {losingItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-800">
                This cannot be undone. Once deleted, your data is gone for good.
              </div>

              <div>
                <label
                  htmlFor="confirm-delete"
                  className="block text-xs font-medium text-slate-700"
                >
                  Type <span className="font-mono font-semibold">{CONFIRM_PHRASE}</span> to confirm
                </label>
                <input
                  id="confirm-delete"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  disabled={submitting}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  autoComplete="off"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 p-5 border-t border-slate-200">
              <button
                type="button"
                onClick={reset}
                disabled={submitting}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting || confirmText !== CONFIRM_PHRASE}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={16} />
                {submitting ? "Deleting…" : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
