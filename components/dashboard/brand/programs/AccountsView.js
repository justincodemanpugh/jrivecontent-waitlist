"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { fetchProgramAccounts, removeProgramMember } from "@/lib/dashboard/brand/programsApi";
import {
  fetchTrackedAccounts,
  removeTrackedAccount,
} from "@/lib/dashboard/brand/trackedAccountsApi";

function formatCompact(n) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    n || 0,
  );
}

// Accounts come from two places: creators enrolled in a program (tracked via
// their program membership) and accounts the brand added directly from the
// "Track Accounts" dialog. Both are shown in one table — they're the same
// thing from the brand's point of view — with `source` deciding which columns
// and actions apply.
export default function AccountsView() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [removingKey, setRemovingKey] = useState(null);

  const load = useCallback(async () => {
    setErr("");
    try {
      // One failing source shouldn't blank the whole table.
      const [programRes, trackedRes] = await Promise.allSettled([
        fetchProgramAccounts(),
        fetchTrackedAccounts(),
      ]);

      const programRows = (programRes.status === "fulfilled" ? programRes.value : []).map(
        (a) => ({
          key: `member:${a.memberId}`,
          memberId: a.memberId,
          source: "program",
          name: a.name,
          handle: a.tiktokHandle,
          avatarUrl: a.avatarUrl,
          programId: a.programId,
          programTitle: a.programTitle,
          status: a.tracking ? "tracking" : "pending",
          videoCount: a.videoCount,
          views: a.views,
          likes: a.likes,
          comments: a.comments,
        }),
      );

      const trackedRows = (trackedRes.status === "fulfilled" ? trackedRes.value : []).map(
        (a) => ({
          key: `tracked:${a.id}`,
          id: a.id,
          source: "tracked",
          name: `@${a.username}`,
          handle: a.username,
          avatarUrl: null,
          status: a.status,
          lastError: a.lastError,
          videoCount: a.videoCount,
          views: a.views,
          likes: a.likes,
          comments: a.comments,
        }),
      );

      if (programRes.status === "rejected" && trackedRes.status === "rejected") {
        throw programRes.reason;
      }

      setRows([...trackedRows, ...programRows].sort((a, b) => b.views - a.views));
    } catch (e) {
      setErr(e.message || "Couldn't load accounts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const refresh = () => load();
    window.addEventListener("tracked-accounts:changed", refresh);
    return () => window.removeEventListener("tracked-accounts:changed", refresh);
  }, [load]);

  // Two different removals behind one button. A campaign member is removed
  // SOFTLY (status -> 'removed') and never hard-deleted: program_payouts
  // cascades from program_members, so deleting the row would take escrowed and
  // released payout records — money Stripe already moved — with it.
  const handleRemove = async (row) => {
    const isProgram = row.source === "program";
    const message = isProgram
      ? `Remove ${row.name} from ${row.programTitle || "this campaign"}? ` +
        `They'll stop being tracked and won't be paid for future videos. ` +
        `Payouts already created are unaffected.`
      : `Stop tracking @${row.handle}?`;
    if (!confirm(message)) return;

    setRemovingKey(row.key);
    try {
      if (isProgram) {
        await removeProgramMember(row.memberId);
      } else {
        await removeTrackedAccount(row.id);
      }
      await load();
    } catch (e) {
      alert(e.message || "Couldn't remove account.");
    } finally {
      setRemovingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-faint">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  if (err) {
    return <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{err}</p>;
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface p-12 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent-tint text-accent mb-3">
          <Users size={20} />
        </span>
        <h2 className="text-lg font-semibold text-ink">No tracked accounts yet</h2>
        <p className="mt-1 text-sm text-muted max-w-sm mx-auto">
          Use <span className="font-medium text-ink">Track Account</span> to add any
          public TikTok account, or add creators to a campaign and their accounts show up here
          automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="px-5 py-3 font-medium">Account</th>
              <th className="px-5 py-3 font-medium">Campaign</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Videos</th>
              <th className="px-5 py-3 font-medium text-right">Views</th>
              <th className="px-5 py-3 font-medium text-right">Likes</th>
              <th className="px-5 py-3 font-medium text-right">Comments</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-line last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={row.name} url={row.avatarUrl} />
                    <div className="min-w-0">
                      <p className="font-medium text-ink truncate">{row.name}</p>
                      <p className="text-xs text-faint truncate">
                        {row.source === "tracked"
                          ? "Tracked directly"
                          : row.handle
                            ? `@${row.handle}`
                            : "TikTok not connected"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  {row.source === "program" ? (
                    <Link
                      href={`/dashboard/brand/programs/${row.programId}`}
                      className="text-accent hover:underline"
                    >
                      {row.programTitle}
                    </Link>
                  ) : (
                    <span className="text-faint">—</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={row.status} error={row.lastError} />
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-muted">
                  {row.videoCount}
                </td>
                <td className="px-5 py-3 text-right tabular-nums font-medium text-ink">
                  {formatCompact(row.views)}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-muted">
                  {formatCompact(row.likes)}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-muted">
                  {formatCompact(row.comments)}
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => handleRemove(row)}
                    disabled={removingKey === row.key}
                    title={
                      row.source === "program"
                        ? "Remove from campaign"
                        : "Stop tracking"
                    }
                    className="text-faint hover:text-danger transition disabled:opacity-40"
                  >
                    {removingKey === row.key ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status, error }) {
  if (status === "error") {
    return (
      <span
        title={error || "Sync failed"}
        className="inline-flex items-center gap-1 rounded-full bg-danger-soft text-danger px-2.5 py-1 text-xs font-medium"
      >
        <AlertCircle size={12} />
        Error
      </span>
    );
  }
  if (status === "tracking") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success-soft text-success px-2.5 py-1 text-xs font-medium">
        <CheckCircle2 size={12} />
        Tracking
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-hover text-muted px-2.5 py-1 text-xs font-medium">
      <Clock size={12} />
      Pending
    </span>
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
    <span className="h-8 w-8 rounded-full bg-accent-tint text-accent flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
      {name?.replace(/^@/, "").slice(0, 2).toUpperCase() || "?"}
    </span>
  );
}
