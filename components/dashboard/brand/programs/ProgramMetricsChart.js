"use client";

import { BarChart3 } from "lucide-react";

function formatCompact(n) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    n || 0,
  );
}

function formatDay(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Lightweight dual-series area chart (Views + Posted Videos), drawn as inline
// SVG — no charting dependency. Light theme to match the rest of the dashboard.
// Views use the left axis, posted videos the right axis (each scaled to its own
// max), mirroring ViralApp's Metrics panel.
export default function ProgramMetricsChart({ series = [] }) {
  const W = 820;
  const H = 280;
  const mL = 52;
  const mR = 52;
  const mT = 16;
  const mB = 30;
  const innerW = W - mL - mR;
  const innerH = H - mT - mB;

  const n = series.length;
  const viewsMax = Math.max(1, ...series.map((s) => s.views));
  const videosMax = Math.max(1, ...series.map((s) => s.postedVideos));
  const hasData = series.some((s) => s.views > 0 || s.postedVideos > 0);

  const x = (i) => (n <= 1 ? mL : mL + (i / (n - 1)) * innerW);
  const yViews = (v) => mT + innerH - (v / viewsMax) * innerH;
  const yVideos = (v) => mT + innerH - (v / videosMax) * innerH;

  const linePath = (accessor, yScale) =>
    series.map((s, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${yScale(accessor(s)).toFixed(1)}`).join(" ");

  const areaPath = (accessor, yScale) =>
    `${linePath(accessor, yScale)} L ${x(n - 1).toFixed(1)} ${(mT + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(mT + innerH).toFixed(1)} Z`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const xLabelIdx = n > 1 ? [0, Math.floor(n / 3), Math.floor((2 * n) / 3), n - 1] : [0];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 size={15} className="text-brand-skyDeep" />
          <h2 className="text-sm font-semibold text-brand-ink">Metrics</h2>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="h-2.5 w-2.5 rounded-sm bg-violet-500" />
            Views
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="h-2.5 w-2.5 rounded-sm bg-brand-skyDeep" />
            Posted Videos
          </span>
        </div>
      </div>

      <div className="relative px-3 py-4">
        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <p className="text-sm text-slate-400 bg-white/70 px-3 py-1.5 rounded-lg">
              No performance data yet — connect a creator&apos;s TikTok to start tracking.
            </p>
          </div>
        )}
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="none">
          {/* horizontal gridlines + dual y-axis labels */}
          {gridLines.map((g) => {
            const y = mT + innerH - g * innerH;
            return (
              <g key={g}>
                <line x1={mL} y1={y} x2={W - mR} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                <text x={mL - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#94a3b8">
                  {formatCompact(viewsMax * g)}
                </text>
                <text x={W - mR + 8} y={y + 3} textAnchor="start" fontSize="10" fill="#94a3b8">
                  {formatCompact(videosMax * g)}
                </text>
              </g>
            );
          })}

          {/* Views area (left axis) */}
          <path d={areaPath((s) => s.views, yViews)} fill="rgba(139,92,246,0.12)" />
          <path
            d={linePath((s) => s.views, yViews)}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Posted Videos area (right axis) */}
          <path d={areaPath((s) => s.postedVideos, yVideos)} fill="rgba(56,189,248,0.14)" />
          <path
            d={linePath((s) => s.postedVideos, yVideos)}
            fill="none"
            stroke="#38BDF8"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* x-axis date labels */}
          {xLabelIdx.map((i) => (
            <text
              key={i}
              x={x(i)}
              y={H - 10}
              textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
              fontSize="10"
              fill="#94a3b8"
            >
              {series[i] ? formatDay(series[i].date) : ""}
            </text>
          ))}
        </svg>
      </div>
    </section>
  );
}
