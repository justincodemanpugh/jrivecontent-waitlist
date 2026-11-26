"use client";

import { useState } from "react";
import { Check, Loader2, Plus } from "lucide-react";

// Used on the Browse Creators cards. A span, because the member card is itself
// a button and buttons can't be nested.
export default function AddToBoardButton({ source, creatorId }) {
  const [state, setState] = useState("idle"); // idle | busy | added
  const [error, setError] = useState("");

  const add = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (state !== "idle") return;
    setState("busy");
    setError("");
    const res = await fetch("/api/board", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source, ref: creatorId }),
    }).catch(() => null);
    if (res?.ok) return setState("added");
    const data = await res?.json().catch(() => ({}));
    setError(data?.error || "Couldn't add them. Try again.");
    setState("idle");
  };

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        onClick={add}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && add(e)}
        className="inline-flex w-full cursor-pointer items-center justify-center gap-1 rounded-full border border-line px-3 py-2 text-xs font-semibold text-ink hover:bg-surface-hover"
      >
        {state === "busy" ? (
          <Loader2 size={12} className="animate-spin" />
        ) : state === "added" ? (
          <Check size={12} />
        ) : (
          <Plus size={12} />
        )}
        {state === "added" ? "On your board" : "Add to board"}
      </span>
      {error && (
        <span role="alert" className="block text-[11px] text-danger">
          {error}
        </span>
      )}
    </>
  );
}
