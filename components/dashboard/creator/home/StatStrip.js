"use client";

import { useEffect, useState } from "react";
import { Sparkles, Wallet, Inbox } from "lucide-react";
import { useCreator } from "@/components/dashboard/creator/CreatorProvider";
import { computeProfileStrength } from "@/lib/dashboard/creator/profileStrength";

function formatMoney(amount) {
  if (typeof amount !== "number" || Number.isNaN(amount)) return "$0";
  return amount % 1 === 0
    ? `$${amount.toFixed(0)}`
    : `$${amount.toFixed(2)}`;
}

// Stats shown above the home page lists. `openApplicationsCount` is computed
// by the parent so we don't double-fetch applications.
export default function StatStrip({ openApplicationsCount }) {
  const creator = useCreator();
  const [earningsThisMonth, setEarningsThisMonth] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/stripe/earnings");
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) {
          setEarningsThisMonth(Number(json.earningsThisMonth) || 0);
        }
      } catch {
        // Leave as null; UI will show $0.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = [
    {
      label: "Open applications",
      value: openApplicationsCount ?? 0,
      icon: Inbox,
    },
    {
      label: "Earnings this month",
      value: formatMoney(earningsThisMonth ?? 0),
      icon: Wallet,
    },
    {
      label: "Profile strength",
      value: `${computeProfileStrength(creator)}%`,
      icon: Sparkles,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            className="rounded-2xl border border-line bg-surface p-4 flex items-center gap-3"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-tint text-accent">
              <Icon size={18} />
            </span>
            <div>
              <p className="text-xs text-muted">{s.label}</p>
              <p className="text-lg font-semibold text-ink">{s.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
