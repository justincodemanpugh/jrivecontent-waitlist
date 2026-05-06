"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical, Eye, PowerOff, Trash2 } from "lucide-react";

/**
 * 3-dot action menu for a gig card.
 * Actions depend on whether the gig is active or deactivated:
 *  - active:       View, Deactivate
 *  - deactivated:  View, Delete
 * (Edit intentionally omitted — published gigs are immutable.)
 */
export default function GigActionsMenu({ gig, onView, onDeactivate, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const stop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const run = (fn) => (e) => {
    stop(e);
    setOpen(false);
    fn?.(gig);
  };

  return (
    <div ref={ref} className="relative" onClick={stop}>
      <button
        type="button"
        aria-label="Gig actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          stop(e);
          setOpen((o) => !o);
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-600 hover:bg-white/70 hover:text-brand-ink transition"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
        >
          <MenuItem icon={Eye} label="View" onClick={run(onView)} />
          {gig.isActive ? (
            <MenuItem
              icon={PowerOff}
              label="Deactivate"
              onClick={run(onDeactivate)}
            />
          ) : (
            <MenuItem
              icon={Trash2}
              label="Delete"
              onClick={run(onDelete)}
              destructive
            />
          )}
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick, destructive }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={[
        "flex w-full items-center gap-2 px-3 py-2 text-sm transition",
        destructive
          ? "text-rose-600 hover:bg-rose-50"
          : "text-brand-ink hover:bg-slate-50",
      ].join(" ")}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}
