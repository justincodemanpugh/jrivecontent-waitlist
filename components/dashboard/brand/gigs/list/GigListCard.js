"use client";

import { useRouter } from "next/navigation";
import { Users, Clock, DollarSign } from "lucide-react";
import { STATUS_META } from "@/lib/dashboard/brand/mockData";
import GigActionsMenu from "./GigActionsMenu";

/**
 * Card used on the Gigs list page. Same visual language as the dashboard
 * GigCard, but clickable via an explicit button (not a wrapping <Link>),
 * so the 3-dot menu can live inside the card without nested-interactive issues.
 */
export default function GigListCard({ gig, onDeactivate, onDelete }) {
  const router = useRouter();
  const status = STATUS_META[gig.status] || STATUS_META.open;

  const open = () => router.push(`/dashboard/brand/gigs/${gig.id}`);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
      className={[
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-white transition",
        "border-slate-200 hover:border-brand-sky hover:-translate-y-0.5",
        !gig.isActive ? "opacity-80" : "",
      ].join(" ")}
    >
      <div
        className={`relative h-28 overflow-hidden ${
          gig.coverImageUrl ? "bg-slate-100" : `bg-gradient-to-br ${gig.cover}`
        }`}
      >
        {gig.coverImageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={gig.coverImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <span
          className={`absolute left-3 top-3 inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-medium ${status.classes}`}
        >
          {status.label}
        </span>

        {!gig.isActive && (
          <span className="absolute left-3 top-10 inline-flex items-center rounded-full border border-slate-300 bg-white/80 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            Deactivated
          </span>
        )}

        <div className="absolute right-2 top-2">
          <GigActionsMenu
            gig={gig}
            onView={open}
            onDeactivate={onDeactivate}
            onDelete={onDelete}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold leading-snug text-brand-ink transition group-hover:text-brand-skyDeep">
          {gig.title}
        </h3>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <DollarSign size={13} className="text-slate-400" />${gig.budget}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={13} className="text-slate-400" />
            {gig.deadline}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users size={13} className="text-slate-400" />
            {gig.applicants}{" "}
            {gig.applicants === 1 ? "applicant" : "applicants"}
          </span>
        </div>
      </div>
    </div>
  );
}
