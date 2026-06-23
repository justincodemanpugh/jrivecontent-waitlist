"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Instagram,
  Music2,
  Youtube,
  MapPin,
  MoreHorizontal,
  Send,
  StickyNote,
  Trash2,
  Clock,
  CheckCircle2,
  Check,
} from "lucide-react";

export default function MyCreatorCard({
  creator,
  selected,
  onToggleSelect,
  onEditNotes,
  onRemove,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = deriveInitials(creator.name);
  const isPending = creator.connectionStatus === "pending";
  const isActive = creator.connectionStatus === "active";

  return (
    <div
      className={`group relative rounded-2xl overflow-hidden border bg-white transition flex flex-col ${
        selected
          ? "border-brand-skyDeep ring-2 ring-brand-skyDeep/20"
          : "border-slate-200 hover:border-brand-sky/60 hover:shadow-md"
      }`}
    >
      {/* Selection checkbox */}
      {isActive && (
        <button
          type="button"
          onClick={onToggleSelect}
          className={`absolute top-2 right-2 z-10 h-6 w-6 rounded-full flex items-center justify-center transition ${
            selected
              ? "bg-brand-skyDeep text-white"
              : "bg-white/90 text-slate-400 opacity-0 group-hover:opacity-100"
          }`}
        >
          {selected && <Check size={14} />}
        </button>
      )}

      {/* Status badge */}
      <div className="absolute top-2 left-2 z-10">
        {isPending ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-medium">
            <Clock size={10} />
            Pending
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-medium">
            <CheckCircle2 size={10} />
            Connected
          </span>
        )}
      </div>

      {/* Cover */}
      <div className="relative aspect-[9/12] w-full bg-gradient-to-br from-brand-mist to-slate-100">
        {creator.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={creator.coverUrl}
            alt={`${creator.name} cover`}
            className="h-full w-full object-cover"
          />
        ) : creator.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={creator.avatarUrl}
            alt={creator.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-4xl font-bold text-slate-300">
            {initials}
          </div>
        )}

        {/* Social pills */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1">
          {creator.instagram ? (
            <span className="h-6 w-6 rounded-full bg-white/95 flex items-center justify-center text-slate-700 shadow-sm">
              <Instagram size={12} />
            </span>
          ) : null}
          {creator.tiktok ? (
            <span className="h-6 w-6 rounded-full bg-white/95 flex items-center justify-center text-slate-700 shadow-sm">
              <Music2 size={12} />
            </span>
          ) : null}
          {creator.youtube ? (
            <span className="h-6 w-6 rounded-full bg-white/95 flex items-center justify-center text-slate-700 shadow-sm">
              <Youtube size={12} />
            </span>
          ) : null}
        </div>
      </div>

      {/* Body */}
      <div className="p-3 flex-1 flex flex-col gap-2">
        <div>
          <p className="font-semibold text-sm text-brand-ink truncate">
            {creator.name}
          </p>
          <p className="text-[11px] text-slate-500 truncate inline-flex items-center gap-1">
            {creator.location ? (
              <>
                <MapPin size={11} className="text-slate-400" />
                {creator.location}
              </>
            ) : creator.handle ? (
              `@${creator.handle}`
            ) : (
              "Creator"
            )}
          </p>
        </div>

        {/* Niches */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {creator.niches.slice(0, 2).map((n) => (
            <span
              key={n}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-brand-mist text-brand-skyDeep"
            >
              {n}
            </span>
          ))}
        </div>

        {/* Notes preview */}
        {creator.notes && (
          <p className="text-[11px] text-slate-500 truncate italic">
            "{creator.notes}"
          </p>
        )}

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2">
          {isActive ? (
            <Link
              href={`/dashboard/brand/briefs/new?creators=${creator.id}`}
              className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-brand-ink text-white px-3 py-2 text-xs font-semibold hover:bg-slate-800 transition"
            >
              <Send size={12} />
              Send Brief
            </Link>
          ) : (
            <span className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-slate-100 text-slate-500 px-3 py-2 text-xs font-semibold">
              <Clock size={12} />
              Awaiting Response
            </span>
          )}

          {/* More menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <MoreHorizontal size={16} />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 bottom-full mb-1 w-40 rounded-xl border border-slate-200 bg-white shadow-lg py-1 z-20">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEditNotes();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <StickyNote size={14} />
                    Edit Notes
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onRemove();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function deriveInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
