"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Inbox } from "lucide-react";

import { fetchAllApplicants } from "@/lib/dashboard/applicationsApi";
import ApplicantListRow from "./ApplicantListRow";

const TABS = [
  { key: "pending", label: "Applied" },
  { key: "accepted", label: "Accepted" },
  { key: "declined", label: "Declined" },
];

export default function ApplicantsView() {
  const [tab, setTab] = useState("pending");
  const [gigFilter, setGigFilter] = useState("all");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      // Fetch all non-withdrawn applicants once; counts + tabs filter client-side.
      const data = await fetchAllApplicants();
      setRows(data);
    } catch (e) {
      setErr(e?.message || "Couldn't load applicants.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const onChange = () => load();
    window.addEventListener("applications:changed", onChange);
    window.addEventListener("conversations:changed", onChange);
    return () => {
      window.removeEventListener("applications:changed", onChange);
      window.removeEventListener("conversations:changed", onChange);
    };
  }, [load]);

  const counts = useMemo(
    () => ({
      pending: rows.filter((r) => r.status === "pending").length,
      accepted: rows.filter((r) => r.status === "accepted").length,
      declined: rows.filter((r) => r.status === "declined").length,
    }),
    [rows],
  );

  const gigs = useMemo(() => {
    const map = new Map();
    rows.forEach((r) => {
      if (r.gig?.id && !map.has(r.gig.id)) {
        map.set(r.gig.id, r.gig.title || "Untitled gig");
      }
    });
    return Array.from(map, ([id, title]) => ({ id, title }));
  }, [rows]);

  const visible = useMemo(() => {
    return rows.filter((r) => {
      if (r.status !== tab) return false;
      if (gigFilter !== "all" && r.gig?.id !== gigFilter) return false;
      return true;
    });
  }, [rows, tab, gigFilter]);

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex rounded-xl bg-surface-hover p-1">
          {TABS.map((t) => {
            const active = tab === t.key;
            const n = counts[t.key];
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                  active
                    ? "bg-surface text-ink shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
              >
                {t.label}
                <span
                  className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold ${
                    active
                      ? "bg-accent-tint text-accent"
                      : "bg-surface-hover text-muted"
                  }`}
                >
                  {n}
                </span>
              </button>
            );
          })}
        </div>

        {gigs.length > 1 ? (
          <label className="text-xs text-muted flex items-center gap-2">
            <span>Gig</span>
            <select
              value={gigFilter}
              onChange={(e) => setGigFilter(e.target.value)}
              className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent-soft"
            >
              <option value="all">All gigs</option>
              {gigs.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {err ? (
        <p className="text-sm text-danger bg-danger-soft border border-danger-line rounded-lg px-3 py-2">
          {err}
        </p>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-faint">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
          <Inbox size={28} className="mx-auto text-faint" />
          <p className="mt-3 text-sm font-medium text-ink">
            {tab === "pending"
              ? "No new applicants right now."
              : tab === "accepted"
              ? "You haven't accepted anyone yet."
              : "Nothing declined."}
          </p>
          <p className="mt-1 text-xs text-muted">
            {tab === "pending"
              ? "When creators apply to your gigs they'll show up here."
              : tab === "accepted"
              ? "Accepted creators will appear here and in Messages."
              : "Declined applicants stay here in case you change your mind."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((app) => (
            <ApplicantListRow
              key={app.id}
              application={app}
              onChanged={load}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
