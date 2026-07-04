"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Users, Eye, Heart, MessageCircle, Film, CheckCircle2, Clock } from "lucide-react";
import { fetchProgramAccounts } from "@/lib/dashboard/brand/programsApi";

function formatCompact(n) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    n || 0,
  );
}

export default function AccountsView() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchProgramAccounts()
      .then((rows) => {
        if (!cancelled) setAccounts(rows.sort((a, b) => b.views - a.views));
      })
      .catch((e) => {
        if (!cancelled) setErr(e.message || "Couldn't load accounts.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
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
    return <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>;
  }

  if (accounts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-mist text-brand-skyDeep mb-3">
          <Users size={20} />
        </span>
        <h2 className="text-lg font-semibold text-brand-ink">No tracked accounts yet</h2>
        <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
          Add creators to a program and their TikTok accounts show up here once
          they connect and start posting.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
              <th className="px-5 py-3 font-medium">Account</th>
              <th className="px-5 py-3 font-medium">Program</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Videos</th>
              <th className="px-5 py-3 font-medium text-right">Views</th>
              <th className="px-5 py-3 font-medium text-right">Likes</th>
              <th className="px-5 py-3 font-medium text-right">Comments</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.memberId} className="border-b border-slate-50 last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={a.name} url={a.avatarUrl} />
                    <div className="min-w-0">
                      <p className="font-medium text-brand-ink truncate">{a.name}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {a.tiktokHandle ? `@${a.tiktokHandle}` : "No TikTok handle"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <Link
                    href={`/dashboard/brand/programs/${a.programId}`}
                    className="text-brand-skyDeep hover:underline"
                  >
                    {a.programTitle}
                  </Link>
                </td>
                <td className="px-5 py-3">
                  {a.tracking ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1 text-xs font-medium">
                      <CheckCircle2 size={12} />
                      Tracking
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-500 px-2.5 py-1 text-xs font-medium">
                      <Clock size={12} />
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-slate-600">
                  {a.videoCount}
                </td>
                <td className="px-5 py-3 text-right tabular-nums font-medium text-brand-ink">
                  {formatCompact(a.views)}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-slate-600">
                  {formatCompact(a.likes)}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-slate-600">
                  {formatCompact(a.comments)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Avatar({ name, url }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={name} className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
    );
  }
  return (
    <span className="h-8 w-8 rounded-full bg-brand-mist text-brand-skyDeep flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
      {name?.slice(0, 2).toUpperCase() || "?"}
    </span>
  );
}
