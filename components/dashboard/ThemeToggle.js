"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

const OPTIONS = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

/**
 * Three-way appearance control, shared by the creator and brand dashboards.
 * `compact` drops the labels so it fits inside the TopBar account dropdown.
 */
export default function ThemeToggle({ compact = false }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Appearance"
      className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-sunken p-1"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={`inline-flex items-center justify-center gap-1.5 rounded-full text-sm font-medium transition ${
              compact ? "h-7 w-9" : "px-3 py-1.5"
            } ${
              active
                ? "bg-surface text-ink shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            <Icon size={15} />
            {compact ? null : label}
          </button>
        );
      })}
    </div>
  );
}
