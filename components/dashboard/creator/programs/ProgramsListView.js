"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Loader2,
  Music2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Film,
  Eye,
  Heart,
  MessageCircle,
  DollarSign,
  Unlink,
} from "lucide-react";
import {
  fetchMyTikTokAccount,
  disconnectTikTok,
  fetchMyProgramMemberships,
  acceptProgramInvite,
  leaveProgram,
} from "@/lib/dashboard/creator/programsApi";

function formatMoney(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

function formatCompact(n) {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(n || 0);
}

export default function ProgramsListView() {
  const searchParams = useSearchParams();
  const tiktokResult = searchParams?.get("tiktok");

  const [account, setAccount] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const reload = useCallback(async () => {
    setErr("");
    try {
      const [acct, rows] = await Promise.all([
        fetchMyTikTokAccount(),
        fetchMyProgramMemberships(),
      ]);
      setAccount(acct);
      setMemberships(rows);
    } catch (e) {
      setErr(e.message || "Couldn't load your programs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    const refresh = () => reload();
    window.addEventListener("creator-programs:changed", refresh);
    return () => window.removeEventListener("creator-programs:changed", refresh);
  }, [reload]);

  const handleDisconnect = async () => {
    if (!confirm("Disconnect your TikTok account? Video tracking will stop.")) return;
    try {
      await disconnectTikTok();
      reload();
    } catch (e) {
      alert(e.message || "Failed to disconnect.");
    }
  };

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

  const invited = memberships.filter((m) => m.status === "invited");
  const active = memberships.filter((m) => m.status === "active");

  return (
    <div className="space-y-6">
      {tiktokResult === "connected" && (
        <Banner tone="success" text="TikTok connected! We'll start tracking your videos shortly." />
      )}
      {tiktokResult === "denied" && (
        <Banner tone="warn" text="TikTok connection was cancelled." />
      )}
      {tiktokResult === "error" && (
        <Banner tone="error" text="Something went wrong connecting TikTok. Please try again." />
      )}
      {tiktokResult === "not_configured" && (
        <Banner tone="warn" text="TikTok isn't configured on this platform yet." />
      )}

      {/* TikTok connection */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        {account ? (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="h-11 w-11 rounded-xl bg-slate-900 flex items-center justify-center text-white flex-shrink-0">
                <Music2 size={20} />
              </span>
              <div>
                <p className="text-sm font-semibold text-brand-ink flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  TikTok connected
                </p>
                <p className="text-xs text-slate-500">
                  {account.username ? `@${account.username}` : "Account linked"}
                </p>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 transition"
            >
              <Unlink size={13} />
              Disconnect
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white mb-3">
              <Music2 size={22} />
            </span>
            <h2 className="text-lg font-semibold text-brand-ink">Connect TikTok</h2>
            <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
              Connect your TikTok account so brands can automatically track your
              posted videos — views, likes, and comments — for programs you join.
            </p>
            <a
              href="/api/auth/tiktok/connect"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-ink text-white px-5 py-2.5 text-sm font-medium hover:bg-slate-800 transition"
            >
              <Music2 size={15} />
              Connect TikTok Account
            </a>
          </div>
        )}
      </div>

      {/* Invitations */}
      {invited.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-brand-ink">
            Program invitations ({invited.length})
          </h2>
          <div className="space-y-3">
            {invited.map((m) => (
              <InviteCard key={m.id} membership={m} onChanged={reload} />
            ))}
          </div>
        </section>
      )}

      {/* Active programs */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-brand-ink">
          Your programs ({active.length})
        </h2>
        {active.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            No active programs yet. Brands will invite you here.
          </div>
        ) : (
          <div className="space-y-3">
            {active.map((m) => (
              <ProgramCard key={m.id} membership={m} onChanged={reload} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Banner({ tone, text }) {
  const tones = {
    success: { cls: "bg-emerald-50 border-emerald-200 text-emerald-700", Icon: CheckCircle2 },
    warn: { cls: "bg-amber-50 border-amber-200 text-amber-700", Icon: AlertCircle },
    error: { cls: "bg-rose-50 border-rose-200 text-rose-700", Icon: XCircle },
  };
  const { cls, Icon } = tones[tone] || tones.warn;
  return (
    <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${cls}`}>
      <Icon size={18} />
      <p className="text-sm">{text}</p>
    </div>
  );
}

function InviteCard({ membership, onChanged }) {
  const [busy, setBusy] = useState(false);

  const handleAccept = async () => {
    setBusy(true);
    try {
      await acceptProgramInvite(membership.id);
      onChanged?.();
    } catch (e) {
      alert(e.message || "Failed to accept.");
      setBusy(false);
    }
  };

  const handleDecline = async () => {
    setBusy(true);
    try {
      await leaveProgram(membership.id);
      onChanged?.();
    } catch (e) {
      alert(e.message || "Failed to decline.");
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-brand-sky/60 bg-brand-mist/40 p-5">
      <p className="text-sm font-semibold text-brand-ink">{membership.title}</p>
      <p className="text-xs text-slate-500 mt-0.5">{membership.brandName}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
        <span className="flex items-center gap-1">
          <Film size={12} />
          {membership.videosPerPeriod} videos/{membership.periodType}
        </span>
        <span className="flex items-center gap-1 font-medium text-emerald-600">
          <DollarSign size={12} />
          {formatMoney(membership.payPerVideoCents)}/video
        </span>
        <span className="capitalize">{membership.payoutSchedule} payouts</span>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={handleAccept}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-ink text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 transition disabled:opacity-60"
        >
          {busy && <Loader2 size={13} className="animate-spin" />}
          Accept
        </button>
        <button
          onClick={handleDecline}
          disabled={busy}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-60"
        >
          Decline
        </button>
      </div>
    </div>
  );
}

function ProgramCard({ membership, onChanged }) {
  const nextPayout = membership.payouts?.find(
    (p) => p.status === "pending" || p.status === "escrowed",
  );

  const handleLeave = async () => {
    if (!confirm(`Leave "${membership.title}"?`)) return;
    try {
      await leaveProgram(membership.id);
      onChanged?.();
    } catch (e) {
      alert(e.message || "Failed to leave.");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-brand-ink">{membership.title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{membership.brandName}</p>
        </div>
        <button
          onClick={handleLeave}
          className="text-xs font-medium text-slate-400 hover:text-rose-600 transition"
        >
          Leave
        </button>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-3 text-center">
        <Metric icon={Film} label="Videos" value={membership.videoCount} />
        <Metric icon={Eye} label="Views" value={formatCompact(membership.totals.views)} />
        <Metric icon={Heart} label="Likes" value={formatCompact(membership.totals.likes)} />
        <Metric
          icon={MessageCircle}
          label="Comments"
          value={formatCompact(membership.totals.comments)}
        />
      </div>

      {nextPayout && (
        <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-3 flex items-center justify-between text-sm">
          <span className="text-slate-600">
            {nextPayout.status === "escrowed" ? "Payment secured" : "Upcoming payout"}
          </span>
          <span className="font-medium text-brand-ink">
            {formatMoney(nextPayout.creatorPayoutCents)}
          </span>
        </div>
      )}
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div>
      <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
        <Icon size={13} />
      </div>
      <p className="text-sm font-semibold text-brand-ink tabular-nums">{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}
