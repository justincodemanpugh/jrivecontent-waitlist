"use client";

import { useEffect, useState } from "react";
import { Sparkles, Wallet, Clock, TrendingUp } from "lucide-react";
import { useCreator } from "@/components/dashboard/creator/CreatorProvider";
import { computeProfileStrength } from "@/lib/dashboard/creator/profileStrength";

function formatMoney(amount) {
  if (typeof amount !== "number" || Number.isNaN(amount)) return "$0";
  return amount % 1 === 0
    ? `$${amount.toFixed(0)}`
    : `$${amount.toFixed(2)}`;
}

// Money + profile stats shown above the home page lists.
export default function StatStrip() {
  const creator = useCreator();
  const [earnings, setEarnings] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/stripe/earnings");
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setEarnings(json);
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
      label: "To receive",
      value: formatMoney(Number(earnings?.pendingToReceive) || 0),
      icon: Clock,
      hint: "Funded by the brand, waiting to be released",
    },
    {
      label: "Earned this month",
      value: formatMoney(Number(earnings?.earningsThisMonth) || 0),
      icon: Wallet,
    },
    {
      label: "Earned all time",
      value: formatMoney(Number(earnings?.earningsTotal) || 0),
      icon: TrendingUp,
    },
    {
      label: "Profile strength",
      value: `${computeProfileStrength(creator)}%`,
      icon: Sparkles,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            title={s.hint}
            className="rounded-2xl border border-line bg-surface p-4 flex items-center gap-3"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-tint text-accent shrink-0">
              <Icon size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted truncate">{s.label}</p>
              <p className="text-lg font-semibold text-ink tabular-nums">{s.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
