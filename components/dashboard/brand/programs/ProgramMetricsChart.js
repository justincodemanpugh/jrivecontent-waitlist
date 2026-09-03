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

// Round an axis maximum up to a readable number with a little headroom, so the
// series never touches the top gridline and the tick labels land on round
// values (300 / 600 / 900) instead of arbitrary fractions of the peak.
// `integer` keeps small counts — e.g. "videos tracked" — off half-steps.
function niceMax(value, { integer = false } = {}) {
  const raw = Math.max(value, 0) * 1.1;
  if (raw <= 0) return integer ? 4 : 1;
  if (integer && raw <= 4) return 4; // 4 ticks of 1 — never "1.5 videos"

  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  const max = step * mag;
  return integer ? Math.max(4, Math.ceil(max / 4) * 4) : max;
}

export const RANGES = [
  { key: "7d", label: "7D", days: 7 },
  { key: "30d", label: "30D", days: 30 },
  { key: "90d", label: "90D", days: 90 },
  { key: "all", label: "All", days: null },
];

// How often to print an x-axis date label, by window length. A 7-day window
// labels every day; longer ones thin out so the labels never collide.
function labelStride(n) {
  if (n <= 8) return 1;
  if (n <= 32) return 5;
  if (n <= 95) return 14;
  return Math.ceil(n / 4);
}

// Dual-series Metrics panel, drawn as inline SVG — no charting dependency.
// Views are cumulative daily bars on the left axis; videos tracked is a filled
// area on the right axis. Colours come from theme tokens via fill-*/stroke-*
// utilities so the chart follows light and dark mode.
export default function ProgramMetricsChart({
  series = [],
  approximate = false,
  lastSyncedAt = null,
  rangeDays = 30,
  onRangeChange,
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
  const viewsMax = niceMax(Math.max(0, ...series.map((s) => s.views)));
  const videosMax = niceMax(Math.max(0, ...series.map((s) => s.postedVideos)), {
    integer: true,
  });
  const hasData = series.some((s) => s.views > 0 || s.postedVideos > 0);

  const colW = n > 0 ? innerW / n : innerW;
  // Bars sit centred in their day column; the area/line uses the same centres.
  const x = (i) => mL + colW * (i + 0.5);
  const yViews = (v) => mT + innerH - (v / viewsMax) * innerH;
  const yVideos = (v) => mT + innerH - (v / videosMax) * innerH;

  const barGap = n > 60 ? 0.5 : 2;
  const barW = Math.max(1, colW - barGap);

  const linePath = (accessor, yScale) =>
    series
      .map((s, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${yScale(accessor(s)).toFixed(1)}`)
      .join(" ");

  const areaPath = (accessor, yScale) =>
    n === 0
      ? ""
      : `${linePath(accessor, yScale)} L ${x(n - 1).toFixed(1)} ${(mT + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(mT + innerH).toFixed(1)} Z`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  const stride = labelStride(n);
  const xLabelIdx = [];
  for (let i = 0; i < n; i += stride) xLabelIdx.push(i);
  if (n > 1 && xLabelIdx[xLabelIdx.length - 1] !== n - 1) {
    // Drop a label that would crowd the final one, then always anchor the end.
    if (n - 1 - xLabelIdx[xLabelIdx.length - 1] < stride / 2) xLabelIdx.pop();
    xLabelIdx.push(n - 1);
  }

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

        <div className="flex items-center gap-4 flex-wrap">
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

          <div className="flex items-center gap-0.5 rounded-full border border-line p-0.5">
            {RANGES.map((r) => {
              const active = r.days === rangeDays;
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => onRangeChange?.(r.days)}
                  aria-pressed={active}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                    active
                      ? "bg-surface-hover text-ink"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
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
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
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

          {/* Views — one bar per day, left axis */}
          {series.map((s, i) => {
            const yTop = yViews(s.views);
            const h = mT + innerH - yTop;
            if (h <= 0) return null;
            return (
              <rect
                key={`bar-${s.date}`}
                x={x(i) - barW / 2}
                y={yTop}
                width={barW}
                height={h}
                rx={n <= 30 ? Math.min(2, barW / 2) : 0}
                className={hoverIdx === i ? "fill-plum" : "fill-plum-solid"}
              />
            );
          })}

          {/* Videos tracked — area over the bars, right axis */}
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
          {series.map((s, i) => (
            <rect
              key={`hit-${s.date}`}
              x={mL + colW * i}
              y={mT}
              width={colW}
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
