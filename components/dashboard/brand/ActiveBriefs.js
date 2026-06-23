import Link from "next/link";
import { ArrowRight, Users, Eye, CheckCircle2, Clock } from "lucide-react";

export default function ActiveBriefs({ briefs }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-brand-ink">Recent briefs</h2>
        <Link
          href="/dashboard/brand/briefs"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-skyDeep hover:gap-1.5 transition-all"
        >
          View all
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {briefs.map((brief) => (
          <BriefCard key={brief.id} brief={brief} />
        ))}
      </div>
    </section>
  );
}

function BriefCard({ brief }) {
  const totalRecipients = brief.recipients?.length || 0;
  const viewedCount = brief.recipients?.filter((r) => r.viewedAt).length || 0;
  const completedCount = brief.recipients?.filter((r) => r.status === "completed").length || 0;

  const createdDate = new Date(brief.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <Link
      href={`/dashboard/brand/briefs/${brief.id}`}
      className="block rounded-2xl border border-slate-200 bg-white p-5 hover:border-brand-sky/60 hover:shadow-md transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-brand-ink truncate">{brief.title}</h3>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
            {brief.instructions || "No instructions"}
          </p>
        </div>
        {brief.payPerCreator && (
          <span className="text-sm font-semibold text-emerald-600 flex-shrink-0">
            ${brief.payPerCreator}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Users size={12} />
          {totalRecipients}
        </span>
        <span className="flex items-center gap-1">
          <Eye size={12} />
          {viewedCount}
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 size={12} />
          {completedCount}
        </span>
        <span className="flex items-center gap-1 ml-auto">
          <Clock size={12} />
          {createdDate}
        </span>
      </div>

      {/* Recipients preview */}
      {brief.recipients && brief.recipients.length > 0 && (
        <div className="mt-3 flex items-center gap-1">
          {brief.recipients.slice(0, 4).map((r) => (
            <div
              key={r.id}
              className="h-6 w-6 rounded-full border-2 border-white -ml-1 first:ml-0 overflow-hidden bg-brand-mist"
              title={r.name}
            >
              {r.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.avatarUrl}
                  alt={r.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="h-full w-full text-brand-skyDeep flex items-center justify-center text-[9px] font-semibold">
                  {r.name?.slice(0, 2).toUpperCase() || "?"}
                </span>
              )}
            </div>
          ))}
          {brief.recipients.length > 4 && (
            <span className="text-[10px] text-slate-400 ml-1">
              +{brief.recipients.length - 4}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
