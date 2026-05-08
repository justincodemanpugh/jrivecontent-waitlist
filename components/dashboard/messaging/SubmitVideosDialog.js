"use client";

import { useEffect, useRef, useState } from "react";
import { X, Upload, Film, Loader2, Trash2 } from "lucide-react";
import {
  MAX_VIDEOS_PER_SUBMISSION,
  ALLOWED_VIDEO_MIME,
  validateVideoFiles,
  submitDeliverable,
} from "@/lib/dashboard/deliverablesApi";

/**
 * Creator-only modal for submitting up to 3 videos to a conversation.
 * Calls onSubmitted with the new deliverable when done.
 */
export default function SubmitVideosDialog({ open, conversation, onClose, onSubmitted }) {
  const [files, setFiles] = useState([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null); // { uploaded, total }
  const [err, setErr] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setFiles([]);
      setNote("");
      setBusy(false);
      setProgress(null);
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
  }, [open, onClose, busy]);

  if (!open) return null;

  const onPick = (e) => {
    const incoming = Array.from(e.target.files || []);
    const next = [...files, ...incoming].slice(0, MAX_VIDEOS_PER_SUBMISSION);
    setFiles(next);
    setErr("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const submit = async () => {
    const validation = validateVideoFiles(files);
    if (validation) {
      setErr(validation);
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const deliverable = await submitDeliverable({
        conversation,
        files,
        note,
        onProgress: (uploaded, total) => setProgress({ uploaded, total }),
      });
      onSubmitted?.(deliverable);
      onClose?.();
    } catch (e) {
      setErr(e.message || "Upload failed.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={() => !busy && onClose?.()}
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl border border-slate-200">
        <div className="flex items-start justify-between gap-4 px-5 pt-5">
          <div>
            <h2 className="text-base font-semibold text-brand-ink">
              Submit videos
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Up to {MAX_VIDEOS_PER_SUBMISSION} videos per submission. mp4, mov,
              m4v, or webm.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition disabled:opacity-40"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 pb-5 pt-3 space-y-3">
          <div>
            <input
              ref={inputRef}
              type="file"
              accept={ALLOWED_VIDEO_MIME.join(",")}
              multiple
              onChange={onPick}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy || files.length >= MAX_VIDEOS_PER_SUBMISSION}
              className="w-full rounded-2xl border-2 border-dashed border-slate-200 hover:border-brand-sky bg-slate-50 px-4 py-6 text-sm text-slate-600 transition flex flex-col items-center gap-2 disabled:opacity-60"
            >
              <Upload size={20} className="text-brand-skyDeep" />
              <span className="font-medium text-brand-ink">
                {files.length >= MAX_VIDEOS_PER_SUBMISSION
                  ? "Max videos selected"
                  : "Click to add videos"}
              </span>
              <span className="text-xs text-slate-500">
                {files.length}/{MAX_VIDEOS_PER_SUBMISSION} selected
              </span>
            </button>
          </div>

          {files.length > 0 ? (
            <ul className="space-y-2">
              {files.map((f, idx) => (
                <li
                  key={`${f.name}-${idx}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <Film size={16} className="text-brand-skyDeep shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-brand-ink">
                      {f.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(f.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  {!busy && (
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="text-slate-400 hover:text-rose-600"
                      aria-label="Remove video"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : null}

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={busy}
            rows={3}
            placeholder="Optional note for the brand…"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-skyDeep focus:outline-none focus:ring-2 focus:ring-brand-sky/30 disabled:opacity-60"
          />

          {err ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {err}
            </p>
          ) : null}

          {progress ? (
            <p className="text-xs text-slate-500 inline-flex items-center gap-1.5">
              <Loader2 size={12} className="animate-spin" />
              Uploading {progress.uploaded} / {progress.total}…
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy || files.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Upload size={14} />
            )}
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
