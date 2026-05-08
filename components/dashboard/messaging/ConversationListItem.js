"use client";

import Link from "next/link";
import { useMemo } from "react";

function formatTimestamp(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString();
}

export default function ConversationListItem({ conversation, basePath, active }) {
  const time = useMemo(
    () => formatTimestamp(conversation.lastMessageAt),
    [conversation.lastMessageAt],
  );
  const initials =
    (conversation.counterpart.name || "?")
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <Link
      href={`${basePath}/${conversation.id}`}
      className={[
        "flex items-center gap-3 px-3 py-3 rounded-xl border transition",
        active
          ? "bg-brand-mist border-brand-sky"
          : "bg-white border-slate-200 hover:border-brand-sky",
      ].join(" ")}
    >
      <span className="h-10 w-10 rounded-full bg-brand-sky text-white text-sm font-semibold inline-flex items-center justify-center shrink-0">
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-brand-ink truncate">
            {conversation.counterpart.name}
          </p>
          <span className="text-[11px] text-slate-400 shrink-0">{time}</span>
        </div>
        <p className="text-xs text-slate-500 truncate">
          {conversation.gigTitle}
        </p>
      </div>
    </Link>
  );
}
