import {
  FileText,
  Users,
  Film,
  CheckCircle2,
  TrendingUp,
  UserPlus,
} from "lucide-react";

export default function StatStrip({ stats }) {
  const items = [
    {
      label: "Active briefs",
      value: stats.activeBriefs ?? 0,
      icon: FileText,
      tint: "bg-sky-50 text-sky-600",
    },
    {
      label: "Connected creators",
      value: stats.connectedCreators ?? 0,
      icon: Users,
      tint: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Videos to review",
      value: stats.videosPendingReview ?? 0,
      icon: Film,
      tint: "bg-amber-50 text-amber-600",
      highlight: (stats.videosPendingReview ?? 0) > 0,
    },
    {
      label: "Completed this month",
      value: stats.completedThisMonth ?? 0,
      icon: CheckCircle2,
      tint: "bg-slate-100 text-slate-600",
    },
    {
      label: "Completion rate",
      value: `${stats.completionRate ?? 0}%`,
      icon: TrendingUp,
      tint: "bg-violet-50 text-violet-600",
    },
    {
      label: "New creators this week",
      value: stats.newCreatorsThisWeek ?? 0,
      icon: UserPlus,
      tint: "bg-rose-50 text-rose-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <div
            key={it.label}
            className={`rounded-2xl border bg-white p-4 transition ${
              it.highlight ? "border-brand-sky/60" : "border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`h-9 w-9 rounded-xl flex items-center justify-center ${it.tint}`}>
                <Icon size={18} />
              </span>
              {it.highlight && (
                <span className="h-2 w-2 rounded-full bg-brand-skyDeep animate-pulse" />
              )}
            </div>
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
