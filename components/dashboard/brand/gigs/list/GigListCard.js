"use client";

import { useRouter } from "next/navigation";
import { Users, Clock, DollarSign, Shield } from "lucide-react";
import { STATUS_META } from "@/lib/dashboard/brand/statusMeta";
import { USAGE_RIGHTS } from "@/lib/dashboard/brand/gigForm";
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
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-surface transition",
        "border-line hover:border-accent-soft hover:-translate-y-0.5",
        !gig.isActive ? "opacity-80" : "",
      ].join(" ")}
    >
      <div
        className={`relative h-28 overflow-hidden ${
          gig.coverImageUrl ? "bg-surface-hover" : `bg-gradient-to-br ${gig.cover}`
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
          <span className="absolute left-3 top-10 inline-flex items-center rounded-full border border-line-strong bg-surface/80 px-2 py-0.5 text-[11px] font-medium text-muted">
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
        <h3 className="font-semibold leading-snug text-ink transition group-hover:text-accent">
          {gig.title}
        </h3>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <DollarSign size={13} className="text-faint" />${gig.budget}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={13} className="text-faint" />
            {gig.deadline}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users size={13} className="text-faint" />
            {gig.applicants}{" "}
            {gig.applicants === 1 ? "applicant" : "applicants"}
          </span>
        </div>
        {/* Usage Rights Badges */}
        <UsageRightsBadges usageRights={gig.usageRights} />
      </div>
    </div>
  );
}

function UsageRightsBadges({ usageRights }) {
  if (!Array.isArray(usageRights) || usageRights.length === 0) return null;

  const hasFullRights = usageRights.length >= USAGE_RIGHTS.length;
  const hasPaidAds = usageRights.includes("paid_ads");
  const hasWhitelisting = usageRights.includes("whitelisting");

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {hasFullRights ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-plum-soft px-2 py-0.5 text-[10px] font-medium text-plum">
          <Shield size={10} />
          Full Rights
        </span>
      ) : (
        <>
          {hasPaidAds && (
            <span className="inline-flex items-center rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-medium text-success">
              💰 Paid Ads
            </span>
          )}
          {hasWhitelisting && (
            <span className="inline-flex items-center rounded-full bg-info-soft px-2 py-0.5 text-[10px] font-medium text-info">
              ⚡ Whitelist
            </span>
          )}
        </>
      )}
    </div>
  );
}
