"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export default function MessageComposer({ onSend, disabled }) {
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
      className="border-t border-line bg-surface px-3 py-3 flex items-center gap-2"
    >
      <input
        type="text"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a message…"
        disabled={disabled || busy}
        className="flex-1 rounded-full border border-line bg-surface-sunken px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft/30 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled || busy || !body.trim()}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink text-on-accent disabled:opacity-40 hover:bg-ink/90 transition"
        aria-label="Send message"
      >
        <Send size={16} />
      </button>
    </form>
  );
}
