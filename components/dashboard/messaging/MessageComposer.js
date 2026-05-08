"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export default function MessageComposer({ onSend, disabled, leftSlot }) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    if (!body.trim() || busy || disabled) return;
    setBusy(true);
    try {
      await onSend(body.trim());
      setBody("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="border-t border-slate-200 bg-white px-3 py-3 flex items-center gap-2"
    >
      {leftSlot}
      <input
        type="text"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a message…"
        disabled={disabled || busy}
        className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-brand-skyDeep focus:outline-none focus:ring-2 focus:ring-brand-sky/30 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled || busy || !body.trim()}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-ink text-white disabled:opacity-40 hover:bg-slate-800 transition"
        aria-label="Send message"
      >
        <Send size={16} />
      </button>
    </form>
  );
}
