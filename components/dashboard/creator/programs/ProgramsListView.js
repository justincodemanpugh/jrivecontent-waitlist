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
  fetchMyTikTokHandle,
  disconnectTikTok,
  fetchMyProgramMemberships,
  acceptProgramInvite,
  leaveProgram,
} from "@/lib/dashboard/creator/programsApi";
import { setCreatorTikTokHandle } from "@/lib/dashboard/creator/profileActions";

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
  const [handle, setHandle] = useState("");
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const reload = useCallback(async () => {
    setErr("");
    try {
      const [acct, savedHandle, rows] = await Promise.all([
        fetchMyTikTokAccount(),
        fetchMyTikTokHandle(),
        fetchMyProgramMemberships(),
      ]);
      setAccount(acct);
      setHandle(savedHandle);
      setMemberships(rows);
    } catch (e) {
      setErr(e.message || "Couldn't load your campaigns.");
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
      <div className="flex items-center justify-center py-20 text-faint">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  if (err) {
    return <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{err}</p>;
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
      <div className="rounded-2xl border border-line bg-surface p-6">
        {account ? (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="h-11 w-11 rounded-xl bg-ink flex items-center justify-center text-on-accent flex-shrink-0">
                <Music2 size={20} />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-success" />
                  TikTok connected
                </p>
                <p className="text-xs text-muted">
                  {account.username ? `@${account.username}` : "Account linked"}
                </p>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-danger transition"
            >
              <Unlink size={13} />
              Disconnect
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-ink text-on-accent mb-3">
              <Music2 size={22} />
            </span>
            <h2 className="text-lg font-semibold text-ink">Connect TikTok</h2>
            <p className="mt-1 text-sm text-muted max-w-sm mx-auto">
              Connect your TikTok account so brands can automatically track your
              posted videos — views, likes, and comments — for campaigns you join.
            </p>
            <a
              href="/api/auth/tiktok/connect"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink text-on-accent px-5 py-2.5 text-sm font-medium hover:bg-ink/90 transition"
            >
              <Music2 size={15} />
              Connect TikTok Account
            </a>

            <HandleFallback handle={handle} onSaved={setHandle} />
          </div>
        )}
      </div>

      {/* Invitations */}
      {invited.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-ink">
            Campaign invitations ({invited.length})
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
        <h2 className="text-sm font-semibold text-ink">
          Your campaigns ({active.length})
        </h2>
        {active.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
            No active campaigns yet. Brands will invite you here.
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

// Fallback for creators who can't complete the OAuth flow: just type the
// handle. Brands' tracking then runs off the public profile (via the
// Apify-based sync) instead of TikTok's authorized Display API.
function HandleFallback({ handle, onSaved }) {
  const [value, setValue] = useState(handle || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  const dirty = value.trim() !== (handle || "");

  const handleSave = async () => {
    setSaving(true);
    setErr("");
    setSaved(false);
    try {
      const res = await setCreatorTikTokHandle(value);
      if (!res.ok) {
        setErr(res.error || "Couldn't save your handle.");
        return;
      }
      setValue(res.handle);
      onSaved?.(res.handle);
      setSaved(true);
    } catch (e) {
      setErr(e.message || "Couldn't save your handle.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6 pt-5 border-t border-line max-w-sm mx-auto text-left">
      <p className="text-xs text-muted text-center mb-3">
        Can&apos;t connect? Enter your TikTok username instead and brands can still
        track your public videos.
      </p>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-faint text-sm">
            @
          </span>
          <input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setSaved(false);
            }}
            placeholder="yourusername"
            spellCheck={false}
            className="w-full rounded-xl border border-line pl-7 pr-3 py-2 text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-medium text-ink-soft hover:bg-surface-sunken transition disabled:opacity-40"
        >
          {saving && <Loader2 size={13} className="animate-spin" />}
          Save
        </button>
      </div>

      {err && <p className="mt-2 text-xs text-danger">{err}</p>}
      {saved && !err && (
        <p className="mt-2 text-xs text-success flex items-center gap-1">
          <CheckCircle2 size={12} />
          {value ? `Tracking @${value}` : "Handle cleared."}
        </p>
      )}
      {!saved && !err && handle && (
        <p className="mt-2 text-xs text-faint">
          Currently tracking <span className="font-medium text-muted">@{handle}</span>
        </p>
      )}
    </div>
  );
}

function Banner({ tone, text }) {
  const tones = {
    success: { cls: "bg-success-soft border-success-line text-success", Icon: CheckCircle2 },
    warn: { cls: "bg-warn-soft border-warn-line text-warn", Icon: AlertCircle },
    error: { cls: "bg-danger-soft border-danger-line text-danger", Icon: XCircle },
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
    <div className="rounded-2xl border border-accent-soft/60 bg-accent-tint/40 p-5">
      <p className="text-sm font-semibold text-ink">{membership.title}</p>
      <p className="text-xs text-muted mt-0.5">{membership.brandName}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
        <span className="flex items-center gap-1">
          <Film size={12} />
          {membership.videosPerPeriod} videos/{membership.periodType}
        </span>
        <span className="flex items-center gap-1 font-medium text-success">
          <DollarSign size={12} />
          {formatMoney(membership.payPerVideoCents)}/video
        </span>
        <span className="capitalize">{membership.payoutSchedule} payouts</span>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={handleAccept}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full bg-ink text-on-accent px-4 py-2 text-sm font-medium hover:bg-ink/90 transition disabled:opacity-60"
        >
          {busy && <Loader2 size={13} className="animate-spin" />}
          Accept
        </button>
        <button
          onClick={handleDecline}
          disabled={busy}
          className="rounded-full border border-line px-4 py-2 text-sm font-medium text-muted hover:bg-surface-sunken transition disabled:opacity-60"
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
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">{membership.title}</p>
          <p className="text-xs text-muted mt-0.5">{membership.brandName}</p>
        </div>
        <button
          onClick={handleLeave}
          className="text-xs font-medium text-faint hover:text-danger transition"
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
        <div className="mt-4 rounded-xl bg-surface-sunken border border-line p-3 flex items-center justify-between text-sm">
          <span className="text-muted">
            {nextPayout.status === "escrowed" ? "Payment secured" : "Upcoming payout"}
          </span>
          <span className="font-medium text-ink">
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
      <div className="flex items-center justify-center gap-1 text-faint mb-1">
        <Icon size={13} />
      </div>
      <p className="text-sm font-semibold text-ink tabular-nums">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}
