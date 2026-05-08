"use client";

import { useEffect, useState } from "react";
import { Check, RotateCcw, Loader2, AlertCircle } from "lucide-react";
import {
  fetchDeliverable,
  getSignedVideoUrls,
  approveDeliverable,
  requestRevision,
} from "@/lib/dashboard/deliverablesApi";

const STATUS_META = {
  submitted: {
    label: "Submitted",
    classes: "bg-sky-50 text-sky-700 border-sky-200",
  },
  approved: {
    label: "Approved",
    classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  revision_requested: {
    label: "Revision requested",
    classes: "bg-amber-50 text-amber-700 border-amber-200",
  },
};

/**
 * Renders a single deliverable submission inside a message thread.
 * - Shows the videos as native <video> previews backed by signed URLs.
 * - For brand role, shows Approve / Request revision actions.
 * - For creator role, shows feedback if revision was requested.
 */
export default function DeliverableCard({ deliverableId, role }) {
  const [deliverable, setDeliverable] = useState(null);
  const [urls, setUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const d = await fetchDeliverable(deliverableId);
      if (!d) throw new Error("Submission not found.");
      setDeliverable(d);
      const paths = d.videos.map((v) => v.storage_path);
      setUrls(await getSignedVideoUrls(paths));
    } catch (e) {
      setErr(e.message || "Couldn't load submission.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliverableId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 inline-flex items-center gap-2 text-sm text-slate-500">
        <Loader2 size={16} className="animate-spin" /> Loading submission…
      </div>
    );
  }
  if (err || !deliverable) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 inline-flex items-center gap-2">
        <AlertCircle size={14} /> {err || "Couldn't load."}
      </div>
    );
  }

  const meta = STATUS_META[deliverable.status] || STATUS_META.submitted;

  const handleApprove = async () => {
    setBusy(true);
    try {
      await approveDeliverable(deliverable.id);
      // Release escrowed payment to creator (15% platform fee retained).
      // Failures here shouldn't block approval; surface a non-fatal note.
      try {
        const res = await fetch("/api/stripe/release", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: deliverable.conversation_id }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          console.warn("Payment release failed:", j.error);
        }
      } catch (relErr) {
        console.warn("Payment release request error:", relErr);
      }
      await load();
    } catch (e) {
      setErr(e.message || "Couldn't approve.");
    } finally {
      setBusy(false);
    }
  };

  const handleRevise = async () => {
    setBusy(true);
    try {
      await requestRevision(deliverable.id, revisionFeedback);
      setRevisionOpen(false);
      setRevisionFeedback("");
      await load();
    } catch (e) {
      setErr(e.message || "Couldn't request revision.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 w-full">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {deliverable.videos.length} video
          {deliverable.videos.length === 1 ? "" : "s"} submitted
        </p>
        <span
          className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border ${meta.classes}`}
        >
          {meta.label}
        </span>
      </div>

      <div
        className={`grid gap-2 ${
          deliverable.videos.length === 1
            ? "grid-cols-1"
            : "grid-cols-2 sm:grid-cols-3"
        }`}
      >
        {deliverable.videos.map((v) => (
          <video
            key={v.id}
            src={urls[v.storage_path]}
            controls
            preload="metadata"
            className="w-full aspect-[9/16] rounded-xl bg-slate-900 object-cover"
          />
        ))}
      </div>

      {deliverable.status === "revision_requested" && deliverable.feedback ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <span className="font-semibold">Revision notes: </span>
          {deliverable.feedback}
        </div>
      ) : null}

      {role === "brand" && deliverable.status === "submitted" ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleApprove}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            <Check size={13} />
            Approve
          </button>
          <button
            type="button"
            onClick={() => setRevisionOpen((v) => !v)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-brand-ink hover:bg-slate-50 disabled:opacity-60"
          >
            <RotateCcw size={13} />
            Request revision
          </button>
        </div>
      ) : null}

      {role === "brand" && revisionOpen ? (
        <div className="mt-3 space-y-2">
          <textarea
            value={revisionFeedback}
            onChange={(e) => setRevisionFeedback(e.target.value)}
            rows={3}
            placeholder="What needs to change?"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-skyDeep focus:outline-none focus:ring-2 focus:ring-brand-sky/30"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRevisionOpen(false)}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRevise}
              disabled={busy || !revisionFeedback.trim()}
              className="rounded-full bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
            >
              Send notes
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
