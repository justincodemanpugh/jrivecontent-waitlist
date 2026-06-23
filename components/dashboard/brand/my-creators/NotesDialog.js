"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { updateCreatorNotes } from "@/lib/dashboard/brand/creatorsApi";

export default function NotesDialog({ creator, onClose }) {
  const [notes, setNotes] = useState(creator.notes || "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setErr("");
    try {
      await updateCreatorNotes(creator.connectionId, notes);
      onClose();
    } catch (e) {
      setErr(e.message || "Failed to save notes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {creator.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={creator.avatarUrl}
                alt={creator.name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span className="h-10 w-10 rounded-full bg-brand-mist text-brand-skyDeep flex items-center justify-center font-semibold text-sm">
                {creator.name?.slice(0, 2).toUpperCase() || "?"}
              </span>
            )}
            <div>
              <p className="font-semibold text-brand-ink">{creator.name}</p>
              <p className="text-xs text-slate-500">Private notes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add private notes about this creator (only you can see this)..."
            rows={4}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-brand-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-skyDeep/20 focus:border-brand-skyDeep resize-none"
          />

          {err && (
            <p className="text-sm text-rose-600">{err}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-brand-ink text-white px-5 py-2 text-sm font-medium hover:bg-slate-800 transition disabled:opacity-60"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Save Notes
          </button>
        </div>
      </div>
    </div>
  );
}
