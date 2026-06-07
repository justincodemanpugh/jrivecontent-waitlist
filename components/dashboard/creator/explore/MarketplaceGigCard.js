"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { USAGE_RIGHTS } from "@/lib/dashboard/brand/gigForm";

export default function MarketplaceGigCard({ gig }) {
  const usageRights = gig.usageRights || [];
  const hasFullRights = usageRights.length >= USAGE_RIGHTS.length;
  const hasPaidAds = usageRights.includes("paid_ads");
  const hasWhitelisting = usageRights.includes("whitelisting");
  return (
    <Link
      href={`/dashboard/creator/explore/${gig.id}`}
      className="group rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-brand-sky hover:-translate-y-0.5 transition flex flex-col"
    >
      <div
        className={`relative h-32 overflow-hidden ${
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
        <span className="absolute right-3 top-3 inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/90 text-brand-ink shadow-sm">
          ${gig.payPerVideo}/video
        </span>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-brand-ink leading-snug group-hover:text-brand-skyDeep transition line-clamp-2">
          {gig.title}
        </h3>
        {gig.videoQuantity ? (
          <p className="mt-1.5 text-xs text-slate-500">
            {gig.videoQuantity} video{gig.videoQuantity === 1 ? "" : "s"} needed
          </p>
        ) : null}
        {/* Usage Rights Badges */}
        {(hasFullRights || hasPaidAds || hasWhitelisting) && (
          <div className="mt-2 flex flex-wrap gap-1">
            {hasFullRights ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                <Shield size={10} />
                Full Rights
              </span>
            ) : (
              <>
                {hasPaidAds && (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                    💰 Paid Ads
                  </span>
                )}
                {hasWhitelisting && (
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                    ⚡ Whitelist
                  </span>
                )}
              </>
            )}
          </div>
        )}
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 min-w-0">
          <span className="font-medium text-slate-700 truncate">
            {gig.brandName}
          </span>
          {gig.brandIndustry ? (
            <>
              <span>·</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-brand-mist text-brand-skyDeep font-medium truncate">
                {gig.brandIndustry}
              </span>
            </>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
