import Link from "next/link";
import { Users, Clock, DollarSign } from "lucide-react";
import { STATUS_META } from "@/lib/dashboard/brand/statusMeta";

export default function GigCard({ gig }) {
  const status = STATUS_META[gig.status] || STATUS_META.open;

  return (
    <Link
      href={`/dashboard/brand/gigs/${gig.id}`}
      className="group rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-brand-sky hover:-translate-y-0.5 transition flex flex-col"
    >
      <div className={`h-28 bg-gradient-to-br ${gig.cover} relative`}>
        <span
          className={`absolute top-3 left-3 inline-flex items-center text-[11px] font-medium px-2 py-1 rounded-full border ${status.classes}`}
        >
          {status.label}
        </span>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-brand-ink leading-snug group-hover:text-brand-skyDeep transition">
          {gig.title}
        </h3>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <DollarSign size={13} className="text-slate-400" />
            ${gig.budget}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={13} className="text-slate-400" />
            {gig.deadline}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users size={13} className="text-slate-400" />
            {gig.applicants} {gig.applicants === 1 ? "applicant" : "applicants"}
          </span>
        </div>
      </div>
    </Link>
  );
}
