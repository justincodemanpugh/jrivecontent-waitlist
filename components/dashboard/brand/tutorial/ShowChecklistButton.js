"use client";

import { useState, useEffect } from "react";
import { ListChecks } from "lucide-react";
import { fetchTutorialProgress, toggleChecklistVisibility } from "@/lib/dashboard/brand/tutorialApi";

export default function ShowChecklistButton() {
  const [hidden, setHidden] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const progress = await fetchTutorialProgress();
        if (!cancelled) {
          setHidden(progress?.checklist_hidden ?? false);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    };
    load();

    const onChange = () => load();
    window.addEventListener("tutorial:changed", onChange);
    return () => {
      cancelled = true;
      window.removeEventListener("tutorial:changed", onChange);
    };
  }, []);

  const handleShow = async () => {
    await toggleChecklistVisibility(false);
    setHidden(false);
  };

  if (loading || !hidden) return null;

  return (
    <button
      onClick={handleShow}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-accent hover:bg-accent-tint transition"
    >
      <ListChecks size={14} />
      Show setup guide
    </button>
  );
}
