"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Inbox } from "lucide-react";
import { fetchMyApplications } from "@/lib/dashboard/applicationsApi";

const STATUS_META = {
  pending: { label: "Pending review", classes: "bg-slate-100 text-slate-600 border-slate-200" },
  accepted: { label: "Accepted", classes: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  declined: { label: "Declined", classes: "bg-rose-50 text-rose-700 border-rose-200" },
  withdrawn: { label: "Withdrawn", classes: "bg-slate-100 text-slate-500 border-slate-200" },
};

function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const minutes = Math.floor((Date.now() - d.getTime()) / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export default function ApplicationsView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const rows = await fetchMyApplications();
        if (!cancelled) setItems(rows);
      } catch (e) {
        if (!cancelled) setErr(e.message || "Couldn't load applications.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const refresh = () => load();
    if (typeof window !== "undefined") {
      window.addEventListener("applications:changed", refresh);
    }
    return () => {
      cancelled = true;
      if (typeof window !== "undefined") {
        window.removeEventListener("applications:changed", refresh);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  if (err) {
    return (
      <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
        {err}
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-mist text-brand-skyDeep mb-3">
          <Inbox size={20} />
        </span>
        <h2 className="text-lg font-semibold text-brand-ink">
          No applications yet
        </h2>
        <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
          Browse open gigs and send your first application — once a brand
          accepts, you&apos;ll start a conversation here.
        </p>
        <Link
          href="/dashboard/creator/explore"
          className="mt-4 inline-flex items-center rounded-full bg-brand-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Explore gigs
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((a) => {
        const meta = STATUS_META[a.status] || STATUS_META.pending;
        return (
          <li
            key={a.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-4"
          >
            <Link
              href={`/dashboard/creator/explore/${a.gig_id}`}
              className="min-w-0 flex-1 group"
            >
              <p className="font-medium text-brand-ink truncate group-hover:text-brand-skyDeep transition">
                {a.gig?.title || "Gig"}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {a.gig?.brand_name || "Brand"}
                {a.gig?.pay_per_video
                  ? ` · $${Number(a.gig.pay_per_video)}/video`
                  : ""}
                {" · "}
                Applied {timeAgo(a.created_at)}
              </p>
            </Link>
            <span
              className={`shrink-0 inline-flex items-center text-[11px] font-medium px-2 py-1 rounded-full border ${meta.classes}`}
            >
              {meta.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
