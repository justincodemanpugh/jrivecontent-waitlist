"use client";

import { useEffect, useState } from "react";
import { X, Loader2, UserPlus, ChevronDown, AlertCircle } from "lucide-react";
import {
  addTrackedAccounts,
  VIDEO_LIMIT_OPTIONS,
} from "@/lib/dashboard/brand/trackedAccountsApi";

const PLACEHOLDER = `@username
https://tiktok.com/@username`;

export default function TrackAccountsModal({ onClose, onAdded }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [videoLimit, setVideoLimit] = useState(30);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [warnings, setWarnings] = useState(null);

  // Trigger the slide-in transition on mount.
  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Play the slide-out transition before actually closing.
  const handleClose = () => {
    setOpen(false);
    setTimeout(onClose, 200);
  };

  const lines = value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const handleSubmit = async () => {
    setSaving(true);
    setErr("");
    setWarnings(null);
    try {
      const res = await addTrackedAccounts(lines, videoLimit);
      onAdded?.(res);

      // Rows were created either way, so surface partial problems rather than
      // failing the whole submission: a bad handle or a missing Apify token
      // still leaves the account queued for the next sync.
      const hasWarnings =
        res.invalid?.length || res.failures?.length || res.apifyConfigured === false;
      if (hasWarnings) {
        setWarnings(res);
        return;
      }
      handleClose();
    } catch (e) {
      setErr(e.message || "Could not add accounts.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className={`absolute inset-0 bg-scrim/40 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      <div
        className={`fixed inset-y-0 right-0 h-full w-full max-w-xl bg-surface shadow-xl border-l border-line flex flex-col transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-line flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-tint text-accent">
                <UserPlus size={20} />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-ink">Track Accounts</h2>
                <p className="text-sm text-muted mt-0.5">
                  Enter accounts you want to track videos &amp; analytics for.
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="h-8 w-8 rounded-full flex items-center justify-center text-faint hover:bg-surface-hover hover:text-muted transition flex-shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="rounded-xl border border-line focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition overflow-hidden">
            <div className="flex items-start gap-3 p-1">
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={7}
                spellCheck={false}
                placeholder={PLACEHOLDER}
                className="flex-1 resize-none bg-transparent px-3 py-2.5 font-mono text-sm text-ink placeholder:text-faint focus:outline-none"
                autoFocus
              />
              <div className="relative flex-shrink-0 pt-2 pr-2">
                <select
                  value={videoLimit}
                  onChange={(e) => setVideoLimit(Number(e.target.value))}
                  className="appearance-none rounded-lg border border-line bg-surface pl-3 pr-8 py-1.5 text-xs font-medium text-muted focus:outline-none focus:border-accent cursor-pointer"
                >
                  {VIDEO_LIMIT_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n} videos
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={13}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 mt-1 text-faint"
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-faint">
            One account per line. Usernames, @handles and full TikTok profile links all work.
          </p>

          {warnings && <WarningPanel warnings={warnings} />}
          {err && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{err}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-line flex-shrink-0">
          <p className="text-xs text-faint">
            {saving
              ? "Fetching videos — this can take a few minutes."
              : `${lines.length} account${lines.length === 1 ? "" : "s"} ready`}
          </p>
          {warnings ? (
            <button
              onClick={handleClose}
              className="inline-flex items-center gap-2 rounded-full bg-ink text-on-accent px-5 py-2 text-sm font-medium hover:bg-ink/90 transition"
            >
              Done
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving || lines.length === 0}
              className="inline-flex items-center gap-2 rounded-full bg-ink text-on-accent px-5 py-2 text-sm font-medium hover:bg-ink/90 transition disabled:opacity-40"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Track Accounts
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function WarningPanel({ warnings }) {
  const { added, videosUpserted, invalid, failures, apifyConfigured } = warnings;
  return (
    <div className="rounded-xl border border-warn-line bg-warn-soft px-4 py-3 space-y-2">
      <div className="flex items-start gap-2.5">
        <AlertCircle size={16} className="mt-0.5 text-warn flex-shrink-0" />
        <div className="space-y-1.5 text-sm">
          <p className="font-medium text-warn">
            Added {added} account{added === 1 ? "" : "s"}
            {videosUpserted ? ` · ${videosUpserted} videos synced` : ""}
          </p>

          {apifyConfigured === false && (
            <p className="text-xs text-warn">
              Video syncing is not configured yet (missing <code>APIFY_API_TOKEN</code>), so
              no metrics were fetched. The accounts are saved and will sync once it&apos;s set.
            </p>
          )}

          {invalid?.length > 0 && (
            <p className="text-xs text-warn">
              Skipped {invalid.length} unreadable entr{invalid.length === 1 ? "y" : "ies"}:{" "}
              {invalid.slice(0, 3).join(", ")}
              {invalid.length > 3 ? "…" : ""}
            </p>
          )}

          {failures?.length > 0 && (
            <div className="text-xs text-warn">
              <p>Couldn&apos;t fetch videos for:</p>
              <ul className="mt-0.5 list-disc pl-4 space-y-0.5">
                {failures.slice(0, 3).map((f) => (
                  <li key={f.username}>
                    @{f.username} — they&apos;ll be retried on the next sync
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
