"use client";

import { useEffect, useState } from "react";
import { Check, RotateCcw, Loader2, AlertCircle, Download } from "lucide-react";
import {
  fetchDeliverable,
  getSignedVideoUrls,
  approveDeliverable,
  requestRevision,
} from "@/lib/dashboard/deliverablesApi";

const STATUS_META = {
  submitted: {
    label: "Submitted",
    classes: "bg-info-soft text-info border-info-line",
  },
  approved: {
    label: "Approved",
    classes: "bg-success-soft text-success border-success-line",
  },
  revision_requested: {
    label: "Revision requested",
    classes: "bg-warn-soft text-warn border-warn-line",
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
  const [actionErr, setActionErr] = useState("");
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownload = async (video, index) => {
    const url = urls[video.storage_path];
    if (!url) return;
    setDownloadingId(video.id);
    try {
      // Fetch as a blob so the browser triggers a real download instead of
      // navigating to the signed URL (cross-origin `download` attr is ignored).
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const ext = (video.storage_path.split(".").pop() || "mp4").toLowerCase();
      const filename = `delivery-${deliverable.id.slice(0, 8)}-video-${index + 1}.${ext}`;
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      setActionErr(`Download failed: ${e.message || e}`);
    } finally {
      setDownloadingId(null);
    }
  };

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
      <div className="rounded-2xl border border-line bg-surface p-4 inline-flex items-center gap-2 text-sm text-muted">
        <Loader2 size={16} className="animate-spin" /> Loading submission…
      </div>
    );
  }
  if (err || !deliverable) {
    return (
      <div className="rounded-2xl border border-danger-line bg-danger-soft p-3 text-sm text-danger inline-flex items-center gap-2">
        <AlertCircle size={14} /> {err || "Couldn't load."}
      </div>
    );
  }

  const meta = STATUS_META[deliverable.status] || STATUS_META.submitted;

  const handleApprove = async () => {
    setBusy(true);
    setActionErr("");
    try {
      await approveDeliverable(deliverable.id);
      // Release escrowed payment to creator (15% platform fee retained).
      try {
        const res = await fetch("/api/stripe/release", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: deliverable.conversation_id }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          setActionErr(
            j.error
              ? `Approved, but payout failed: ${j.error}`
              : "Approved, but payout failed. Try again or contact support.",
          );
        }
      } catch (relErr) {
        setActionErr(
          `Approved, but payout request errored: ${relErr.message || relErr}`,
        );
      }
      await load();
    } catch (e) {
      setActionErr(e.message || "Couldn't approve.");
    } finally {
      setBusy(false);
    }
  };

  const handleRetryPayout = async () => {
    setBusy(true);
    setActionErr("");
    try {
      const res = await fetch("/api/stripe/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: deliverable.conversation_id }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionErr(j.error || "Payout failed. Try again or contact support.");
      }
    } catch (e) {
      setActionErr(`Payout request errored: ${e.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  const handleRevise = async () => {
    setBusy(true);
    setActionErr("");
    try {
      await requestRevision(deliverable.id, revisionFeedback);
      setRevisionOpen(false);
      setRevisionFeedback("");
      await load();
    } catch (e) {
      setActionErr(e.message || "Couldn't request revision.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-surface p-3 w-full max-w-[260px]">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-xs font-semibold text-muted uppercase tracking-wide">
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
        {deliverable.videos.map((v, idx) => (
          <div key={v.id} className="relative group">
            <video
              src={urls[v.storage_path]}
              controls
              preload="metadata"
              className="w-full aspect-[9/16] rounded-xl bg-slate-900 object-cover"
            />
            {role === "brand" && deliverable.status === "approved" ? (
              <button
                type="button"
                onClick={() => handleDownload(v, idx)}
                disabled={downloadingId === v.id}
                title="Download video"
                aria-label={`Download video ${idx + 1}`}
                className="absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black/80 disabled:opacity-60 transition"
              >
                {downloadingId === v.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {deliverable.status === "revision_requested" && deliverable.feedback ? (
        <div className="mt-3 rounded-xl border border-warn-line bg-warn-soft px-3 py-2 text-xs text-warn">
          <span className="font-semibold">Revision notes: </span>
          {deliverable.feedback}
        </div>
      ) : null}

      {actionErr ? (
        <div className="mt-3 rounded-xl border border-danger-line bg-danger-soft px-3 py-2 text-xs text-danger flex items-start gap-2">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <p>{actionErr}</p>
            {role === "brand" && deliverable.status === "approved" ? (
              <button
                type="button"
                onClick={handleRetryPayout}
                disabled={busy}
                className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-danger-solid px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-danger-solid/90 disabled:opacity-60"
              >
                {busy ? <Loader2 size={11} className="animate-spin" /> : null}
                Retry payout
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {role === "brand" && deliverable.status === "submitted" ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleApprove}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full bg-success-solid px-3 py-1.5 text-xs font-semibold text-white hover:bg-success-solid/90 disabled:opacity-60"
          >
            <Check size={13} />
            Approve
          </button>
          <button
            type="button"
            onClick={() => setRevisionOpen((v) => !v)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-sunken disabled:opacity-60"
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
            className="w-full rounded-xl border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft/30"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRevisionOpen(false)}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-muted hover:bg-surface-hover"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRevise}
              disabled={busy || !revisionFeedback.trim()}
              className="rounded-full bg-warn-solid px-3 py-1.5 text-xs font-semibold text-white hover:bg-warn-solid/90 disabled:opacity-60"
            >
              Send notes
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
