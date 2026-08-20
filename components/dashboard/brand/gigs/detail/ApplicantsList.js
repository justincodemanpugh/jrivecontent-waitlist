"use client";

import { useEffect, useState } from "react";
import { Loader2, Inbox } from "lucide-react";
import { fetchApplicantsForGig } from "@/lib/dashboard/applicationsApi";
import ApplicantRow from "./ApplicantRow";

export default function ApplicantsList({ gigId, brandId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const rows = await fetchApplicantsForGig(gigId);
      setItems(rows);
    } catch (e) {
      setErr(e.message || "Couldn't load applicants.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const refresh = () => load();
    if (typeof window !== "undefined") {
      window.addEventListener("applications:changed", refresh);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("applications:changed", refresh);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gigId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-faint">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  if (err) {
    return (
      <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
        {err}
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface p-12 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent-tint text-accent mb-3">
          <Inbox size={20} />
        </span>
        <h3 className="text-sm font-semibold text-ink">
          No applicants yet
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted mx-auto">
          As creators apply, they&apos;ll show up here so you can review and
          accept.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((a) => (
        <ApplicantRow
          key={a.id}
          application={a}
          gigId={gigId}
          brandId={brandId}
          onChanged={load}
        />
      ))}
    </ul>
  );
}
