"use client";

import { useState } from "react";
import {
  Instagram,
  Music2,
  Youtube,
  MapPin,
  MoreHorizontal,
  StickyNote,
  Trash2,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default function MyCreatorCard({
  creator,
  onEditNotes,
  onRemove,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = deriveInitials(creator.name);
  const isPending = creator.connectionStatus === "pending";

  return (
    <div className="group relative rounded-2xl overflow-hidden border border-line bg-surface transition flex flex-col hover:border-accent-soft/60 hover:shadow-md">
      {/* Status badge */}
      <div className="absolute top-2 left-2 z-10">
        {isPending ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warn-soft text-warn text-[10px] font-medium">
            <Clock size={10} />
            Pending
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success-soft text-success text-[10px] font-medium">
            <CheckCircle2 size={10} />
            Connected
          </span>
        )}
      </div>

      {/* Cover */}
      <div className="relative aspect-[9/12] w-full bg-gradient-to-br from-accent-tint to-surface-hover">
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
          <div className="h-full w-full flex items-center justify-center text-4xl font-bold text-faint">
            {initials}
          </div>
        )}

        {/* Social pills */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1">
          {creator.instagram ? (
            <span className="h-6 w-6 rounded-full bg-surface/95 flex items-center justify-center text-ink-soft shadow-sm">
              <Instagram size={12} />
            </span>
          ) : null}
          {creator.tiktok ? (
            <span className="h-6 w-6 rounded-full bg-surface/95 flex items-center justify-center text-ink-soft shadow-sm">
              <Music2 size={12} />
            </span>
          ) : null}
          {creator.youtube ? (
            <span className="h-6 w-6 rounded-full bg-surface/95 flex items-center justify-center text-ink-soft shadow-sm">
              <Youtube size={12} />
            </span>
          ) : null}
        </div>
      </div>

      {/* Body */}
      <div className="p-3 flex-1 flex flex-col gap-2">
        <div>
          <p className="font-semibold text-sm text-ink truncate">
            {creator.name}
          </p>
          <p className="text-[11px] text-muted truncate inline-flex items-center gap-1">
            {creator.location ? (
              <>
                <MapPin size={11} className="text-faint" />
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
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-accent-tint text-accent"
            >
              {n}
            </span>
          ))}
        </div>

        {/* Notes preview */}
        {creator.notes && (
          <p className="text-[11px] text-muted truncate italic">
            "{creator.notes}"
          </p>
        )}

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2">
          {isPending && (
            <span className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-surface-hover text-muted px-3 py-2 text-xs font-semibold">
              <Clock size={12} />
              Awaiting Response
            </span>
          )}

          {/* More menu */}
          <div className="relative ml-auto">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-faint hover:bg-surface-hover hover:text-muted transition"
            >
              <MoreHorizontal size={16} />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 bottom-full mb-1 w-40 rounded-xl border border-line bg-surface shadow-lg py-1 z-20">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEditNotes();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-soft hover:bg-surface-sunken"
                  >
                    <StickyNote size={14} />
                    Edit Notes
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onRemove();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger-soft"
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
