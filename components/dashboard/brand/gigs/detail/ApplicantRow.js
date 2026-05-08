"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2, Instagram, Music2, Youtube, MapPin } from "lucide-react";
import {
  acceptApplication,
  declineApplication,
} from "@/lib/dashboard/applicationsApi";

const STATUS_META = {
  pending: { label: "Pending", classes: "bg-slate-100 text-slate-600 border-slate-200" },
  accepted: { label: "Accepted", classes: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  declined: { label: "Declined", classes: "bg-rose-50 text-rose-700 border-rose-200" },
  withdrawn: { label: "Withdrawn", classes: "bg-slate-100 text-slate-500 border-slate-200" },
};

function deriveInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function ApplicantRow({ application, gigId, brandId, onChanged }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const creator = application.creator || {};
  const meta = STATUS_META[application.status] || STATUS_META.pending;

  const handleDecline = async () => {
    setBusy(true);
    setErr("");
    try {
      await declineApplication(application.id);
      onChanged?.();
    } catch (e) {
      setErr(e.message || "Couldn't decline.");
    } finally {
      setBusy(false);
    }
  };

  const handleAccept = async () => {
    setBusy(true);
    setErr("");
    try {
      const conversation = await acceptApplication({
        id: application.id,
        gig_id: gigId,
        creator_id: application.creator_id,
        brand_id: brandId,
      });
      onChanged?.();
      router.push(`/dashboard/brand/messages/${conversation.id}`);
    } catch (e) {
      setErr(e.message || "Couldn't accept.");
      setBusy(false);
    }
  };

  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        {creator.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={creator.avatar_url}
            alt=""
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <span className="h-12 w-12 rounded-full bg-brand-sky text-white text-sm font-semibold inline-flex items-center justify-center shrink-0">
            {deriveInitials(creator.display_name || creator.handle)}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <p className="font-semibold text-brand-ink truncate">
                {creator.display_name || creator.handle || "Creator"}
              </p>
              {creator.handle ? (
                <p className="text-xs text-slate-500 truncate">
                  @{creator.handle}
                  {creator.location ? (
                    <>
                      <span className="mx-1">·</span>
                      <MapPin size={11} className="inline -mt-0.5 mr-0.5" />
                      {creator.location}
                    </>
                  ) : null}
                </p>
              ) : null}
            </div>
            <span
              className={`inline-flex items-center text-[11px] font-medium px-2 py-1 rounded-full border ${meta.classes}`}
            >
              {meta.label}
            </span>
          </div>

          {creator.niches?.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {creator.niches.slice(0, 5).map((n) => (
                <span
                  key={n}
                  className="inline-flex items-center px-2 py-0.5 rounded-full bg-brand-mist text-brand-skyDeep text-[11px] font-medium"
                >
                  {n}
                </span>
              ))}
            </div>
          ) : null}

          {creator.bio ? (
            <p className="mt-2 text-sm text-slate-600 line-clamp-2">
              {creator.bio}
            </p>
          ) : null}

          {application.pitch ? (
            <div className="mt-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold mb-1">
                Pitch
              </p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {application.pitch}
              </p>
            </div>
          ) : null}

          <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
            {creator.instagram_handle ? (
              <a
                href={`https://instagram.com/${creator.instagram_handle.replace(/^@/, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-brand-ink"
              >
                <Instagram size={13} />
                {creator.instagram_handle}
              </a>
            ) : null}
            {creator.tiktok_handle ? (
              <a
                href={`https://tiktok.com/@${creator.tiktok_handle.replace(/^@/, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-brand-ink"
              >
                <Music2 size={13} />
                {creator.tiktok_handle}
              </a>
            ) : null}
            {creator.youtube_handle ? (
              <a
                href={`https://youtube.com/${creator.youtube_handle.startsWith("@") ? creator.youtube_handle : `@${creator.youtube_handle}`}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-brand-ink"
              >
                <Youtube size={13} />
                {creator.youtube_handle}
              </a>
            ) : null}
          </div>

          {err ? (
            <p className="mt-2 text-xs text-rose-700 bg-rose-50 rounded px-2 py-1">
              {err}
            </p>
          ) : null}

          {application.status === "pending" ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleAccept}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                Accept & message
              </button>
              <button
                type="button"
                onClick={handleDecline}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-brand-ink hover:bg-slate-50 disabled:opacity-60"
              >
                <X size={13} />
                Decline
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}
