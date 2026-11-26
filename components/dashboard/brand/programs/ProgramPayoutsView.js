"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Wallet,
  CheckCircle2,
  Loader as LoaderIcon,
  CalendarClock,
  AlertCircle,
} from "lucide-react";
import {
  fetchMyProgramPayouts,
  releaseProgramPayout,
  fetchBrandEarnings,
  fetchPayoutBatches,
  nextPayoutRunAt,
} from "@/lib/dashboard/brand/programsApi";
import { brandChargeBreakdown } from "@/lib/earnings/calc";

// Display-only estimate; the real numbers come from lib/payouts/run.js.
const FEE_ESTIMATE = {
  platformFeeRate: Number(process.env.NEXT_PUBLIC_PLATFORM_FEE_RATE || 0.05),
  stripeFeePercent: 0.029,
  stripeFeeFixedCents: 30,
};

const KIND_LABELS = { base: "Base", cpm: "CPM", revshare: "Rev share", adjustment: "Adjustment" };

function formatMoney(cents) {
  const n = Number(cents || 0) / 100;
  return `${n < 0 ? "-" : ""}$${Math.abs(n).toFixed(2)}`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ProgramPayoutsView() {
  const [earnings, setEarnings] = useState([]);
  const [batches, setBatches] = useState([]);
  const [legacy, setLegacy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("upcoming");
  const [releasing, setReleasing] = useState(null);

  const reload = useCallback(async () => {
    setErr("");
    try {
      const [e, b, l] = await Promise.all([
        fetchBrandEarnings(),
        fetchPayoutBatches(),
        fetchMyProgramPayouts().catch(() => []),
      ]);
      setEarnings(e);
      setBatches(b);
      setLegacy(l);
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

  const now = new Date();
  const nextRun = nextPayoutRunAt(now);

  // Unpaid earnings, split by whether they'll be in the next charge.
  const { dueNext, onHold, byCreator, paidTotal } = useMemo(() => {
    const unpaid = earnings.filter((e) => e.status === "held" || e.status === "payable");
    const dueNextRows = unpaid.filter(
      (e) => e.status === "payable" || new Date(e.availableAt) <= nextRun,
    );
    const creators = new Map();
    for (const e of unpaid) {
      const c = creators.get(e.creatorId) || {
        creatorId: e.creatorId,
        name: e.creatorName,
        avatarUrl: e.creatorAvatarUrl,
        dueNext: 0,
        onHold: 0,
        kinds: {},
      };
      if (dueNextRows.includes(e)) c.dueNext += e.amountCents;
      else c.onHold += e.amountCents;
      c.kinds[e.kind] = (c.kinds[e.kind] || 0) + e.amountCents;
      creators.set(e.creatorId, c);
    }
    return {
      dueNext: dueNextRows.reduce((s, e) => s + e.amountCents, 0),
      onHold: unpaid.filter((e) => !dueNextRows.includes(e)).reduce((s, e) => s + e.amountCents, 0),
      byCreator: [...creators.values()].sort((a, b) => b.dueNext + b.onHold - (a.dueNext + a.onHold)),
      paidTotal: earnings.filter((e) => e.status === "paid").reduce((s, e) => s + e.amountCents, 0),
    };
    // nextRun only changes weekly; earnings drive this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [earnings]);

  const estimate = dueNext > 0 ? brandChargeBreakdown(dueNext, FEE_ESTIMATE) : null;
  const lastBatch = batches[0];
  const legacyOpen = legacy.filter((p) => p.status === "escrowed" || p.status === "pending");

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

  const tabs = [
    { key: "upcoming", label: `Upcoming (${byCreator.length})` },
    { key: "history", label: `History (${batches.length})` },
    ...(legacy.length ? [{ key: "legacy", label: `Earlier payouts (${legacy.length})` }] : []),
  ];

  return (
    <div className="space-y-5">
      {lastBatch && (lastBatch.status === "failed" || lastBatch.status === "requires_action") && (
        <div className="flex items-start gap-3 rounded-xl border border-warn-line bg-warn-soft px-4 py-3">
          <AlertCircle size={18} className="mt-0.5 text-warn flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-warn">
              Last charge of {formatMoney(lastBatch.chargeCents)} failed
            </p>
            <p className="text-xs text-warn mt-0.5">
              {lastBatch.lastError || "Your card was declined."} Update your card in{" "}
              <Link href="/dashboard/brand/settings/billing" className="underline">
                Billing
              </Link>
              {lastBatch.nextRetryAt ? `; we'll retry on ${formatDate(lastBatch.nextRetryAt)}.` : "."}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          icon={CalendarClock}
          label={`Next charge · ${nextRun.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`}
          value={estimate ? `≈ ${formatMoney(estimate.chargeCents)}` : "$0.00"}
          hint={
            estimate
              ? `${formatMoney(dueNext)} to creators + ${formatMoney(estimate.platformFeeCents + estimate.processingFeeCents)} fees`
              : "Nothing due yet"
          }
        />
        <StatCard
          icon={Wallet}
          label="On hold"
          value={formatMoney(onHold)}
          hint="CPM waits 7 days, rev share 30 days, so you can reject fakes and refunds come back"
        />
        <StatCard icon={CheckCircle2} label="Paid to creators" value={formatMoney(paidTotal)} hint="All time" />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              tab === t.key ? "bg-ink text-on-accent" : "bg-surface-hover text-muted hover:bg-surface-hover"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "upcoming" &&
        (byCreator.length === 0 ? (
          <Empty
            title="No unpaid earnings"
            body="When creators' videos are approved, get views or bring in subscribers, their earnings show up here and are paid automatically every Monday."
          />
        ) : (
          <Table head={["Creator", "Breakdown", "Next payout", "On hold"]}>
            {byCreator.map((c) => (
              <tr key={c.creatorId} className="border-b border-line last:border-0">
                <td className="px-5 py-3">
                  <CreatorCell name={c.name} avatarUrl={c.avatarUrl} />
                </td>
                <td className="px-5 py-3 text-muted text-xs">
                  {Object.entries(c.kinds)
                    .map(([k, v]) => `${KIND_LABELS[k] || k} ${formatMoney(v)}`)
                    .join(" · ")}
                </td>
                <td className="px-5 py-3 font-medium text-ink tabular-nums">{formatMoney(c.dueNext)}</td>
                <td className="px-5 py-3 text-muted tabular-nums">{formatMoney(c.onHold)}</td>
              </tr>
            ))}
          </Table>
        ))}

      {tab === "history" &&
        (batches.length === 0 ? (
          <Empty title="No payouts yet" body="Each Monday's charge and the creators it paid will be listed here." />
        ) : (
          <Table head={["Date", "To creators", "Fees", "Charged", "Status"]}>
            {batches.map((b) => (
              <tr key={b.id} className="border-b border-line last:border-0">
                <td className="px-5 py-3 text-muted">{formatDate(b.paidAt || b.createdAt)}</td>
                <td className="px-5 py-3 tabular-nums text-ink">{formatMoney(b.earningsCents)}</td>
                <td className="px-5 py-3 tabular-nums text-muted">
                  {formatMoney(b.platformFeeCents + b.processingFeeCents)}
                </td>
                <td className="px-5 py-3 tabular-nums font-medium text-ink">{formatMoney(b.chargeCents)}</td>
                <td className="px-5 py-3">
                  <BatchStatus status={b.status} />
                </td>
              </tr>
            ))}
          </Table>
        ))}

      {tab === "legacy" && (
        <>
          {legacyOpen.length > 0 && (
            <p className="text-xs text-muted">
              These were created before automatic payouts. Fund and release them from the campaign
              page as before; everything new is paid automatically.
            </p>
          )}
          <Table head={["Creator", "Campaign", "Period", "Amount", ""]}>
            {legacy.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0">
                <td className="px-5 py-3">
                  <CreatorCell name={p.creatorName} avatarUrl={p.creatorAvatarUrl} />
                </td>
                <td className="px-5 py-3">
                  <Link href={`/dashboard/brand/programs/${p.programId}`} className="text-accent hover:underline">
                    {p.programTitle}
                  </Link>
                </td>
                <td className="px-5 py-3 text-muted">
                  {p.payoutType === "test"
                    ? "One-time test video"
                    : `${formatDate(p.periodStart)} – ${formatDate(p.periodEnd)}`}
                </td>
                <td className="px-5 py-3 font-medium text-ink">{formatMoney(p.creatorPayoutCents)}</td>
                <td className="px-5 py-3 text-right">
                  {p.status === "escrowed" && (
                    <button
                      onClick={() => handleRelease(p.id)}
                      disabled={releasing === p.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-success-solid text-white px-3 py-1.5 text-xs font-medium hover:bg-success-solid/90 transition disabled:opacity-60"
                    >
                      {releasing === p.id ? <LoaderIcon size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                      Release
                    </button>
                  )}
                  {(p.status === "released" || p.status === "released_pending") && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                      <CheckCircle2 size={12} />
                      Paid
                    </span>
                  )}
                  {p.status === "pending" && <span className="text-xs text-muted">Not funded</span>}
                  {p.status === "failed" && <span className="text-xs text-danger">Failed</span>}
                </td>
              </tr>
            ))}
          </Table>
        </>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="flex items-center gap-1.5 text-xs text-muted">
        <Icon size={13} />
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-ink tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-faint">{hint}</p>}
    </div>
  );
}

function Empty({ title, body }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface p-12 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent-tint text-accent mb-3">
        <Wallet size={20} />
      </span>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-muted max-w-md mx-auto">{body}</p>
    </div>
  );
}

function Table({ head, children }) {
  return (
    <div className="rounded-2xl border border-line bg-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              {head.map((h, i) => (
                <th key={i} className="px-5 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

function CreatorCell({ name, avatarUrl }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-7 w-7 rounded-full bg-accent-tint text-accent flex items-center justify-center text-[10px] font-semibold overflow-hidden flex-shrink-0">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          name?.slice(0, 2).toUpperCase()
        )}
      </span>
      <span className="text-ink">{name}</span>
    </div>
  );
}

function BatchStatus({ status }) {
  const map = {
    paid: { cls: "bg-success-soft text-success", label: "Paid" },
    charging: { cls: "bg-surface-hover text-muted", label: "Processing" },
    failed: { cls: "bg-danger-soft text-danger", label: "Failed" },
    requires_action: { cls: "bg-warn-soft text-warn", label: "Needs card update" },
  };
  const cfg = map[status] || map.charging;
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg.cls}`}>{cfg.label}</span>;
}
