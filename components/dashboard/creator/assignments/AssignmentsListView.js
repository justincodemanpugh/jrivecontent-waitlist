"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  FileText,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Upload,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { fetchMyAssignments } from "@/lib/dashboard/creator/assignmentsApi";

function formatMoney(cents) {
  if (cents == null) return null;
  return `$${(cents / 100).toFixed(2)}`;
}

// Derive a single high-level state for list display.
export function assignmentState(a) {
  if (a.reviewStatus === "approved" || a.escrowStatus === "released") {
    return { key: "paid", label: "Approved & Paid", icon: CheckCircle2, tone: "emerald" };
  }
  if (a.reviewStatus === "changes_requested") {
    return { key: "changes", label: "Changes requested", icon: AlertCircle, tone: "amber" };
  }
  if (a.submissionStoragePath) {
    return { key: "in_review", label: "In review", icon: Clock, tone: "sky" };
  }
  if (a.escrowStatus === "escrowed") {
    return { key: "upload", label: "Upload your video", icon: Upload, tone: "ink" };
  }
  return { key: "waiting", label: "Awaiting brand payment", icon: Clock, tone: "slate" };
}

const TONE = {
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  sky: "bg-brand-mist text-brand-skyDeep",
  ink: "bg-brand-ink text-white",
  slate: "bg-slate-100 text-slate-500",
};

export default function AssignmentsListView() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const reload = useCallback(async () => {
    setErr("");
    try {
      const rows = await fetchMyAssignments();
      setAssignments(rows);
    } catch (e) {
      setErr(e.message || "Couldn't load assignments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    const refresh = () => reload();
    window.addEventListener("assignments:changed", refresh);
    return () => window.removeEventListener("assignments:changed", refresh);
  }, [reload]);

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

  if (assignments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-mist text-brand-skyDeep mb-3">
          <FileText size={20} />
        </span>
        <h2 className="text-lg font-semibold text-brand-ink">
          No assignments yet
        </h2>
        <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
          When a brand sends you a brief, it&apos;ll appear here. Make sure your
          profile is complete so brands can find you.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {assignments.map((a) => {
        const state = assignmentState(a);
        const StateIcon = state.icon;
        const pay = formatMoney(a.payoutCents) || (a.payPerCreator ? `$${Number(a.payPerCreator).toFixed(2)}` : null);
        return (
          <Link
            key={a.id}
            href={`/dashboard/creator/assignments/${a.id}`}
            className="block rounded-2xl border border-slate-200 bg-white p-5 hover:border-brand-sky/60 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-slate-500">{a.brandName}</p>
                <h3 className="font-semibold text-brand-ink truncate">
                  {a.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                  {a.instructions || "No instructions"}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium flex-shrink-0 ${TONE[state.tone]}`}
              >
                <StateIcon size={12} />
                {state.label}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-slate-500">
                {a.escrowStatus === "escrowed" && !a.submissionStoragePath && (
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <ShieldCheck size={13} />
                    Payment Secured
                  </span>
                )}
                {pay && (
                  <span className="font-medium text-brand-ink">{pay}</span>
                )}
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-skyDeep">
                Open
                <ArrowRight size={14} />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
