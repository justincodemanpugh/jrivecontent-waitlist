"use client";

const TABS = [
  { id: "active", label: "Active" },
  { id: "deactivated", label: "Deactivated" },
];

export default function GigsTabs({ value, onChange, counts }) {
  return (
    <div className="inline-flex rounded-full bg-surface-hover p-1 text-sm">
      {TABS.map((tab) => {
        const active = value === tab.id;
        const count = counts?.[tab.id] ?? 0;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={[
              "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-medium transition",
              active
                ? "bg-surface text-ink shadow-sm"
                : "text-muted hover:text-ink",
            ].join(" ")}
          >
            {tab.label}
            <span
              className={[
                "inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold",
                active ? "bg-accent-tint text-ink" : "bg-surface-hover text-muted",
              ].join(" ")}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
