import { Film, Users, Eye, Heart, MessageCircle, Zap } from "lucide-react";

function formatCompact(n) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    n || 0,
  );
}

export default function ProgramStatStrip({ stats }) {
  const items = [
    {
      label: "Posted videos",
      value: formatCompact(stats.postedVideos),
      icon: Film,
      tint: "bg-sky-50 text-sky-600",
    },
    {
      label: "Active accounts",
      value: stats.activeAccounts ?? 0,
      icon: Users,
      tint: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Views",
      value: formatCompact(stats.views),
      icon: Eye,
      tint: "bg-violet-50 text-violet-600",
    },
    {
      label: "Likes",
      value: formatCompact(stats.likes),
      icon: Heart,
      tint: "bg-rose-50 text-rose-600",
    },
    {
      label: "Comments",
      value: formatCompact(stats.comments),
      icon: MessageCircle,
      tint: "bg-amber-50 text-amber-600",
    },
    {
      label: "Engagement",
      value: `${stats.engagementRate ?? 0}%`,
      icon: Zap,
      tint: "bg-slate-100 text-slate-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <div
            key={it.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 transition"
          >
            <span className={`h-9 w-9 rounded-xl flex items-center justify-center ${it.tint}`}>
              <Icon size={18} />
            </span>
            <p className="mt-3 text-2xl font-semibold text-brand-ink tabular-nums">
              {it.value}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{it.label}</p>
          </div>
        );
      })}
    </div>
  );
}
