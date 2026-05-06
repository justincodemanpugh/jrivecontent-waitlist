import { Briefcase, Users, CheckCircle2, Sparkles } from "lucide-react";

export default function StatStrip({ stats }) {
  const items = [
    {
      label: "Active gigs",
      value: stats.activeGigs,
      icon: Briefcase,
      tint: "bg-sky-50 text-sky-600",
    },
    {
      label: "New applications",
      value: stats.newApplications,
      icon: Users,
      tint: "bg-emerald-50 text-emerald-600",
      highlight: stats.newApplications > 0,
    },
    {
      label: "Awaiting approval",
      value: stats.awaitingApproval,
      icon: Sparkles,
      tint: "bg-amber-50 text-amber-600",
      highlight: stats.awaitingApproval > 0,
    },
    {
      label: "Completed this month",
      value: stats.completedThisMonth,
      icon: CheckCircle2,
      tint: "bg-slate-100 text-slate-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
