"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2, MessageSquare } from "lucide-react";
import { fetchMyConversations } from "@/lib/dashboard/conversationsApi";
import ConversationListItem from "./ConversationListItem";

/**
 * Renders the conversations list for either role. `basePath` is where each
 * row should link (e.g. "/dashboard/brand/messages").
 */
export default function InboxList({ role, basePath, emptyCopy }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchMyConversations(role);
        if (!cancelled) setItems(data);
      } catch (e) {
        if (!cancelled) setErr(e.message || "Couldn't load conversations.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const refresh = () => load();
    if (typeof window !== "undefined") {
      window.addEventListener("conversations:changed", refresh);
    }
    return () => {
      cancelled = true;
      if (typeof window !== "undefined") {
        window.removeEventListener("conversations:changed", refresh);
      }
    };
  }, [role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  if (err) {
    return (
      <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
        {err}
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-mist text-brand-skyDeep mb-3">
          <MessageSquare size={20} />
        </span>
        <h2 className="text-lg font-semibold text-brand-ink">No messages yet</h2>
        <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
          {emptyCopy}
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((c) => (
        <li key={c.id}>
          <ConversationListItem
            conversation={c}
            basePath={basePath}
            active={pathname === `${basePath}/${c.id}`}
          />
        </li>
      ))}
    </ul>
  );
}
