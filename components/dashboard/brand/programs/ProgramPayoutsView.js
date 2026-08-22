"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Wallet, CheckCircle2, Loader as LoaderIcon } from "lucide-react";
import { fetchMyProgramPayouts, releaseProgramPayout } from "@/lib/dashboard/brand/programsApi";

const TABS = [
  { key: "due", label: "Due", statuses: ["escrowed"] },
  { key: "upcoming", label: "Upcoming", statuses: ["pending"] },
  { key: "paid", label: "Paid", statuses: ["released", "released_pending"] },
  { key: "failed", label: "Failed", statuses: ["failed"] },
];

function formatMoney(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ProgramPayoutsView() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("due");
  const [releasing, setReleasing] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const rows = await fetchMyProgramPayouts();
      setPayouts(rows);
    } catch (e) {
      setErr(e.message || "Couldn't load payouts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    const refresh = () => reload();
    window.addEventListener("programs:changed", refresh);
    return () => window.removeEventListener("programs:changed", refresh);
  }, [reload]);

  const handleRelease = async (payoutId) => {
    setReleasing(payoutId);
    try {
      await releaseProgramPayout(payoutId);
    } catch (e) {
      alert(e.message || "Could not release payout.");
    } finally {
      setReleasing(null);
    }
  };

  const activeTab = TABS.find((t) => t.key === tab);
  const displayPayouts = payouts.filter((p) => activeTab.statuses.includes(p.status));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              tab === t.key
                ? "bg-ink text-on-accent"
                : "bg-surface-hover text-muted hover:bg-surface-hover"
            }`}
          >
            {t.label} (
            {payouts.filter((p) => t.statuses.includes(p.status)).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-faint">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : err ? (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{err}</p>
      ) : displayPayouts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-12 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent-tint text-accent mb-3">
            <Wallet size={20} />
          </span>
          <h2 className="text-lg font-semibold text-ink">No {activeTab.label.toLowerCase()} payouts</h2>
          <p className="mt-1 text-sm text-muted">
            Finished billing periods will show up here.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-5 py-3 font-medium">Creator</th>
                <th className="px-5 py-3 font-medium">Program</th>
                <th className="px-5 py-3 font-medium">Billing period</th>
                <th className="px-5 py-3 font-medium">Videos</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {displayPayouts.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-7 w-7 rounded-full bg-accent-tint text-accent flex items-center justify-center text-[10px] font-semibold overflow-hidden">
                        {p.creatorAvatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.creatorAvatarUrl} alt={p.creatorName} className="h-full w-full object-cover" />
                        ) : (
                          p.creatorName?.slice(0, 2).toUpperCase()
                        )}
                      </span>
                      {p.creatorName}
                      {p.payoutType === "test" && (
                        <span className="rounded-full bg-accent-tint px-2 py-0.5 text-[10px] font-semibold text-accent">
                          Test
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/dashboard/brand/programs/${p.programId}`}
                      className="text-accent hover:underline"
                    >
                      {p.programTitle}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-muted">
                    {p.payoutType === "test"
                      ? "One-time test video"
                      : `${formatDate(p.periodStart)} – ${formatDate(p.periodEnd)}`}
                  </td>
                  <td className="px-5 py-3 text-muted">
                    {p.payoutType === "test" ? "—" : p.videoCount}
                  </td>
                  <td className="px-5 py-3 font-medium text-ink">
                    {formatMoney(p.creatorPayoutCents)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {p.status === "escrowed" && (
                      <button
                        onClick={() => handleRelease(p.id)}
                        disabled={releasing === p.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-success-solid text-white px-3 py-1.5 text-xs font-medium hover:bg-success-solid/90 transition disabled:opacity-60"
                      >
                        {releasing === p.id ? (
                          <LoaderIcon size={12} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={12} />
                        )}
                        Release
                      </button>
                    )}
                    {(p.status === "released" || p.status === "released_pending") && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                        <CheckCircle2 size={12} />
                        Paid
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
