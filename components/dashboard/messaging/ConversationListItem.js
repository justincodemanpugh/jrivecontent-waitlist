"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { MoreVertical, Trash2, Loader2 } from "lucide-react";
import { hideConversationForBrand } from "@/lib/dashboard/conversationsApi";

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

export default function ConversationListItem({
  conversation,
  basePath,
  active,
  canHide = false,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hiding, setHiding] = useState(false);
  const menuRef = useRef(null);

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

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  const handleHide = async () => {
    setMenuOpen(false);
    setHiding(true);
    try {
      await hideConversationForBrand(conversation.id);
    } catch (e) {
      alert(e.message || "Couldn't remove this conversation.");
      setHiding(false);
    }
  };

  return (
    <div className="relative">
      <Link
        href={`${basePath}/${conversation.id}`}
        className={[
          "flex items-center gap-3 px-3 py-3 rounded-xl border transition",
          active
            ? "bg-accent-tint border-accent-soft"
            : "bg-surface border-line hover:border-accent-soft",
          canHide ? "pr-11" : "",
        ].join(" ")}
      >
        <span className="h-10 w-10 rounded-full bg-accent-soft text-on-accent text-sm font-semibold inline-flex items-center justify-center shrink-0 overflow-hidden">
          {conversation.counterpart.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={conversation.counterpart.avatarUrl}
              alt={conversation.counterpart.name}
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-ink truncate">
              {conversation.counterpart.name}
            </p>
            <span className="text-[11px] text-faint shrink-0">{time}</span>
          </div>
          <p className="text-xs text-muted truncate">
            {conversation.gigTitle}
          </p>
        </div>
      </Link>

      {canHide && (
        <div ref={menuRef} className="absolute right-2 top-1/2 -translate-y-1/2">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            disabled={hiding}
            aria-label={`Conversation options for ${conversation.counterpart.name}`}
            className="h-8 w-8 rounded-full inline-flex items-center justify-center text-faint hover:bg-surface-hover hover:text-ink transition"
          >
            {hiding ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <MoreVertical size={15} />
            )}
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-20 w-48 rounded-xl border border-line bg-surface shadow-lg py-1">
              <button
                type="button"
                onClick={handleHide}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-surface-hover transition text-left"
              >
                <Trash2 size={14} />
                Remove from inbox
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
