"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";

function formatCompact(n) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    n || 0,
  );
}

function formatDay(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatSyncedAt(iso) {
  if (!iso) return null;
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// Lightweight dual-series area chart (Views + Posted Videos), drawn as inline
// SVG — no charting dependency. Colours come from the theme tokens via
// fill-*/stroke-* utilities so the chart follows light and dark mode.
// Views use the left axis, posted videos the right axis (each scaled to its own
// max), mirroring ViralApp's Metrics panel.
export default function ProgramMetricsChart({
  series = [],
  approximate = false,
  lastSyncedAt = null,
}) {
  const [hoverIdx, setHoverIdx] = useState(null);
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
    <section className="rounded-2xl border border-line bg-surface">
      <div className="px-5 py-4 border-b border-line flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <BarChart3 size={15} className="text-accent" />
          <h2 className="text-sm font-semibold text-ink">Metrics</h2>
          {n > 1 && (
            <span className="text-xs text-faint">
              {formatDay(series[0].date)} – {formatDay(series[n - 1].date)}
            </span>
          )}
          {lastSyncedAt && (
            <span className="text-xs text-faint">
              · synced {formatSyncedAt(lastSyncedAt)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-muted">
            <span className="h-2.5 w-2.5 rounded-sm bg-plum-solid" />
            Views
          </span>
          <span className="flex items-center gap-1.5 text-muted">
            <span className="h-2.5 w-2.5 rounded-sm bg-accent" />
            Videos tracked
          </span>
        </div>
      </div>

      {approximate && hasData && (
        <p className="px-5 pt-3 text-xs text-faint">
          Estimated from post dates — not enough sync history yet to chart real
          view growth. This corrects itself as tracking data accumulates.
        </p>
      )}

      <div className="relative px-3 py-4">
        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <p className="text-sm text-faint bg-surface/70 px-3 py-1.5 rounded-lg">
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
                <line x1={mL} y1={y} x2={W - mR} y2={y} className="stroke-line" strokeWidth="1" />
                <text x={mL - 8} y={y + 3} textAnchor="end" fontSize="10" className="fill-faint">
                  {formatCompact(viewsMax * g)}
                </text>
                <text x={W - mR + 8} y={y + 3} textAnchor="start" fontSize="10" className="fill-faint">
                  {formatCompact(videosMax * g)}
                </text>
              </g>
            );
          })}

          {/* Views area (left axis) */}
          <path d={areaPath((s) => s.views, yViews)} className="fill-plum-solid/10" />
          <path
            d={linePath((s) => s.views, yViews)}
            fill="none"
            className="stroke-plum-solid"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Posted Videos area (right axis) */}
          <path d={areaPath((s) => s.postedVideos, yVideos)} className="fill-accent/15" />
          <path
            d={linePath((s) => s.postedVideos, yVideos)}
            fill="none"
            className="stroke-accent"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Hover crosshair + markers */}
          {hoverIdx !== null && series[hoverIdx] && (
            <g pointerEvents="none">
              <line
                x1={x(hoverIdx)}
                y1={mT}
                x2={x(hoverIdx)}
                y2={mT + innerH}
                className="stroke-faint"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle
                cx={x(hoverIdx)}
                cy={yViews(series[hoverIdx].views)}
                r="3.5"
                className="fill-plum-solid"
              />
              <circle
                cx={x(hoverIdx)}
                cy={yVideos(series[hoverIdx].postedVideos)}
                r="3.5"
                className="fill-accent"
              />
            </g>
          )}

          {/* Invisible hit targets — one column per day. */}
          {n > 1 &&
            series.map((s, i) => (
              <rect
                key={s.date}
                x={x(i) - innerW / (n - 1) / 2}
                y={mT}
                width={innerW / (n - 1)}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
              />
            ))}

          {/* x-axis date labels */}
          {xLabelIdx.map((i) => (
            <text
              key={i}
              x={x(i)}
              y={H - 10}
              textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
              fontSize="10"
              className="fill-faint"
            >
              {series[i] ? formatDay(series[i].date) : ""}
            </text>
          ))}
        </svg>

        {hoverIdx !== null && series[hoverIdx] && (
          <div
            className="pointer-events-none absolute top-6 z-20 -translate-x-1/2 rounded-lg border border-line bg-surface px-3 py-2 shadow-lg"
            style={{ left: `${(x(hoverIdx) / W) * 100}%` }}
          >
            <p className="text-[11px] font-medium text-ink whitespace-nowrap">
              {formatDay(series[hoverIdx].date)}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted whitespace-nowrap">
              <span className="h-2 w-2 rounded-sm bg-plum-solid" />
              {formatCompact(series[hoverIdx].views)} views
            </p>
            <p className="flex items-center gap-1.5 text-[11px] text-muted whitespace-nowrap">
              <span className="h-2 w-2 rounded-sm bg-accent" />
              {series[hoverIdx].postedVideos} videos tracked
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
