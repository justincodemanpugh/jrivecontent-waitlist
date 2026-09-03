"use client";

import { useMemo, useState } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import ProgramStatStrip from "@/components/dashboard/brand/programs/ProgramStatStrip";
import ProgramMetricsChart from "@/components/dashboard/brand/programs/ProgramMetricsChart";
import { windowSeries, deltasFromSeries } from "@/lib/dashboard/brand/programsApi";

const DAY = 86400000;

function daysAgo(k) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return new Date(d.getTime() - k * DAY).toISOString();
}

// Mirrors the reported account: two snapshot days only.
const sparse = [
  { date: daysAgo(1), views: 200, likes: 5, comments: 0, postedVideos: 1 },
  { date: daysAgo(0), views: 1200, likes: 20, comments: 8, postedVideos: 2 },
];

// A longer history, to check the 90D/All look.
const rich = Array.from({ length: 120 }, (_, i) => {
  const t = i / 119;
  return {
    date: daysAgo(119 - i),
    views: Math.round(740_000_000 * t ** 3),
    likes: Math.round(40_000_000 * t ** 3),
    comments: Math.round(520_000 * t ** 3),
    postedVideos: Math.round(69_000 * t ** 2.2),
  };
});

export default function TmpMetricsPreview() {
  const [rangeDays, setRangeDays] = useState(30);
  const [which, setWhich] = useState("sparse");
  const full = which === "sparse" ? sparse : rich;
  const windowed = useMemo(() => windowSeries(full, rangeDays), [full, rangeDays]);
  const deltas = deltasFromSeries(windowed);
  const last = windowed[windowed.length - 1] || {};

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-surface-sunken text-ink">
      <div className="mx-auto max-w-6xl space-y-6 p-8">
        <div className="flex gap-2">
          {["sparse", "rich"].map((k) => (
            <button
              key={k}
              onClick={() => setWhich(k)}
              className={`rounded-full border border-line px-3 py-1 text-sm ${
                which === k ? "bg-surface-hover text-ink" : "text-muted"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
        <ProgramStatStrip
          stats={{
            postedVideos: last.postedVideos,
            activeAccounts: 1,
            views: last.views,
            likes: last.likes,
            comments: last.comments,
            engagementRate: 2.4,
            deltas,
          }}
        />
        <ProgramMetricsChart
          series={windowed}
          lastSyncedAt={new Date(Date.now() - 49 * 60000).toISOString()}
          rangeDays={rangeDays}
          onRangeChange={setRangeDays}
        />
      </div>
      </div>
    </ThemeProvider>
  );
}
