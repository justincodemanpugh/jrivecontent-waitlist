import { Film, Users, Eye, Heart, MessageCircle, Zap } from "lucide-react";

function formatCompact(n) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    n || 0,
  );
}

function formatDelta(n) {
  if (!n) return null;
  const sign = n > 0 ? "+" : "";
  return `${sign}${formatCompact(n)}`;
}

export default function ProgramStatStrip({ stats }) {
  const d = stats.deltas || {};
  const items = [
    {
      label: "Posted videos",
      value: formatCompact(stats.postedVideos),
      delta: formatDelta(d.postedVideos),
      icon: Film,
      tint: "bg-info-soft text-info",
    },
    {
      label: "Active accounts",
      value: stats.activeAccounts ?? 0,
      delta: formatDelta(d.activeAccounts),
      icon: Users,
      tint: "bg-success-soft text-success",
    },
    {
      label: "Views",
      value: formatCompact(stats.views),
      delta: formatDelta(d.views),
      icon: Eye,
      tint: "bg-plum-soft text-plum",
    },
    {
      label: "Likes",
      value: formatCompact(stats.likes),
      delta: formatDelta(d.likes),
      icon: Heart,
      tint: "bg-danger-soft text-danger",
    },
    {
      label: "Comments",
      value: formatCompact(stats.comments),
      delta: formatDelta(d.comments),
      icon: MessageCircle,
      tint: "bg-warn-soft text-warn",
    },
    {
      label: "Engagement",
      value: `${stats.engagementRate ?? 0}%`,
      delta: null,
      icon: Zap,
      tint: "bg-surface-hover text-muted",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <div
            key={it.label}
            className="rounded-2xl border border-line bg-surface p-4 transition"
          >
            <span className={`h-9 w-9 rounded-xl flex items-center justify-center ${it.tint}`}>
              <Icon size={18} />
            </span>
            <div className="mt-3 flex items-baseline gap-1.5">
              <p className="text-2xl font-semibold text-ink tabular-nums">{it.value}</p>
              {it.delta && (
                <span className="text-xs font-semibold text-success tabular-nums">
                  {it.delta}
                </span>
              )}
            </div>
            <p className="text-xs text-muted mt-0.5">{it.label}</p>
          </div>
        );
      })}
    </div>
  );
}
