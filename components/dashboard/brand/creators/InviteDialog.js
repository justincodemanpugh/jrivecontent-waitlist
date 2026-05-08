"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Briefcase, Send } from "lucide-react";
import {
  fetchInvitableGigs,
  inviteCreatorToGig,
} from "@/lib/dashboard/brand/creatorsApi";

// Modal that asks the brand which gig they're inviting the creator to.
// If the brand only has one eligible gig we still show it so they can attach
// a message before sending.
export default function InviteDialog({ creator, onClose, onInvited }) {
  const [gigs, setGigs] = useState([]);
  const [loadingGigs, setLoadingGigs] = useState(true);
  const [selectedGigId, setSelectedGigId] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchInvitableGigs();
        if (cancelled) return;
        setGigs(rows);
        if (rows.length === 1) setSelectedGigId(rows[0].id);
      } catch (e) {
        if (!cancelled) setError(e.message || "Couldn't load your gigs.");
      } finally {
        if (!cancelled) setLoadingGigs(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!selectedGigId) {
      setError("Pick a gig to invite this creator to.");
      return;
    }
    setSubmitting(true);
    try {
      await inviteCreatorToGig({
        creatorId: creator.id,
        gigId: selectedGigId,
        message,
      });
      onInvited?.();
      onClose();
    } catch (err) {
      setError(err.message || "Could not send invitation.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <form
        onSubmit={handleSubmit}
        className="relative bg-white w-full sm:max-w-md sm:rounded-2xl shadow-xl p-5 sm:p-6 space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-brand-ink">
              Invite {creator.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Send a direct invitation to one of your gigs.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
          >
            <X size={16} />
          </button>
        </div>

        {/* Gig picker */}
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1.5 block">
            Which gig?
          </label>

          {loadingGigs ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
              <Loader2 size={14} className="animate-spin" />
              Loading your gigs…
            </div>
          ) : gigs.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              You don&apos;t have an active, open gig yet. Post one first and
              then come back to invite this creator.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {gigs.map((g) => {
                const checked = selectedGigId === g.id;
                return (
                  <label
                    key={g.id}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2 cursor-pointer transition ${
                      checked
                        ? "border-brand-skyDeep bg-brand-mist/40"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="gig"
                      value={g.id}
                      checked={checked}
                      onChange={() => setSelectedGigId(g.id)}
                      className="accent-brand-skyDeep"
                    />
                    <Briefcase size={14} className="text-slate-400 shrink-0" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-brand-ink truncate">
                        {g.title}
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        ${Number(g.pay_per_video) || 0}/video · {g.status}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Optional message */}
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1.5 block">
            Optional note (visible to the creator)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Hey, your style is exactly what we're looking for…"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-brand-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-sky/40 focus:border-brand-sky resize-y"
          />
          <p className="mt-1 text-[11px] text-slate-400 text-right">
            {message.length}/500
          </p>
        </div>

        {error ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || loadingGigs || gigs.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            Send invitation
          </button>
        </div>
      </form>
    </div>
  );
}
