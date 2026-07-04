"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  Film,
  Eye,
  Heart,
  MessageCircle,
  DollarSign,
  Plus,
  CheckCircle2,
  Link2,
  UserX,
} from "lucide-react";
import {
  fetchProgramById,
  addProgramMember,
  removeProgramMember,
  fundProgramPayout,
  releaseProgramPayout,
} from "@/lib/dashboard/brand/programsApi";
import { fetchMyCreators } from "@/lib/dashboard/brand/creatorsApi";

function formatMoney(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

function formatCompact(n) {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(n || 0);
}

// Current billing period boundaries based on the program's period type.
function currentPeriod(periodType) {
  const now = new Date();
  if (periodType === "week") {
    const day = now.getDay(); // 0 = Sunday
    const diffToMonday = (day + 6) % 7;
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(now.getDate() - diffToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start, end };
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

export default function ProgramDetailView({ programId }) {
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const reload = useCallback(async () => {
    if (!programId) return;
    setErr("");
    try {
      const data = await fetchProgramById(programId);
      setProgram(data);
    } catch (e) {
      setErr(e.message || "Couldn't load this program.");
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    reload();
    const refresh = () => reload();
    window.addEventListener("programs:changed", refresh);
    return () => window.removeEventListener("programs:changed", refresh);
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
      <div className="space-y-4">
        <BackLink />
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>
      </div>
    );
  }

  if (!program) return null;

  const { start, end } = currentPeriod(program.periodType);
  const activeMembers = program.members.filter((m) => m.status !== "removed");

  return (
    <div className="space-y-6">
      <BackLink />

      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-brand-ink">
              {program.title}
            </h1>
            <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">
              {program.description || "No description."}
            </p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-ink text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 transition flex-shrink-0"
          >
            <Plus size={14} />
            Add Creator
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1.5 font-medium text-emerald-600">
            <DollarSign size={15} />
            {formatMoney(program.payPerVideoCents)} per video
          </span>
          <span className="flex items-center gap-1.5">
            <Film size={15} />
            {program.videosPerPeriod} videos / {program.periodType}
          </span>
          <span className="capitalize">{program.payoutSchedule} payouts</span>
        </div>
      </div>

      {/* Creators */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-brand-ink">
          Creators ({activeMembers.length})
        </h2>
        {activeMembers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            No creators yet. Add one to start tracking their TikTok performance.
          </div>
        ) : (
          <div className="space-y-3">
            {activeMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                program={program}
                period={{ start, end }}
                onChanged={reload}
              />
            ))}
          </div>
        )}
      </section>

      {addOpen && (
        <AddCreatorModal
          programId={program.id}
          existingCreatorIds={program.members.map((m) => m.creatorId)}
          onClose={() => setAddOpen(false)}
        />
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard/brand/programs/manage"
      className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-ink transition"
    >
      <ArrowLeft size={15} />
      Back to programs
    </Link>
  );
}

function MemberStatusBadge({ status }) {
  const map = {
    active: { cls: "bg-emerald-50 text-emerald-700", label: "Active" },
    invited: { cls: "bg-amber-50 text-amber-700", label: "Invited" },
    paused: { cls: "bg-slate-100 text-slate-500", label: "Paused" },
  };
  const cfg = map[status] || map.invited;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function MemberCard({ member, program, period, onChanged }) {
  const [funding, setFunding] = useState(false);
  const [error, setError] = useState("");

  const videosThisPeriod = member.videos.filter((v) => {
    if (!v.postedAt) return false;
    const posted = new Date(v.postedAt);
    return posted >= period.start && posted < period.end;
  });
  const billableCount = Math.min(videosThisPeriod.length, program.videosPerPeriod);
  const owedCents = billableCount * program.payPerVideoCents;

  const currentPayout = member.payouts?.find(
    (p) =>
      new Date(p.periodStart).getTime() === period.start.getTime() &&
      new Date(p.periodEnd).getTime() === period.end.getTime(),
  );

  const handleFund = async () => {
    setError("");
    setFunding(true);
    try {
      const url = await fundProgramPayout({
        programMemberId: member.id,
        periodStart: period.start.toISOString(),
        periodEnd: period.end.toISOString(),
      });
      window.location.href = url;
    } catch (e) {
      setError(e.message || "Could not start deposit.");
      setFunding(false);
    }
  };

  const handleRelease = async () => {
    setError("");
    setFunding(true);
    try {
      await releaseProgramPayout(currentPayout.id);
      onChanged?.();
    } catch (e) {
      setError(e.message || "Could not release payout.");
    } finally {
      setFunding(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm(`Remove ${member.name} from this program?`)) return;
    try {
      await removeProgramMember(member.id);
      onChanged?.();
    } catch (e) {
      alert(e.message || "Failed to remove.");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar member={member} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-brand-ink truncate">{member.name}</p>
            <p className="text-xs text-slate-500 truncate flex items-center gap-1">
              <Link2 size={11} />
              {member.tiktokHandle ? `@${member.tiktokHandle}` : "TikTok not connected"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <MemberStatusBadge status={member.status} />
          <button
            onClick={handleRemove}
            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-rose-500 transition"
            title="Remove from program"
          >
            <UserX size={15} />
          </button>
        </div>
      </div>

      {/* Metrics this period */}
      <div className="mt-4 grid grid-cols-4 gap-3 text-center">
        <Metric icon={Film} label="Videos" value={videosThisPeriod.length} />
        <Metric icon={Eye} label="Views" value={formatCompact(member.totals.views)} />
        <Metric icon={Heart} label="Likes" value={formatCompact(member.totals.likes)} />
        <Metric icon={MessageCircle} label="Comments" value={formatCompact(member.totals.comments)} />
      </div>

      {/* Payout for current period */}
      {member.status === "active" && (
        <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm text-slate-600">
              This period: {billableCount} video{billableCount !== 1 ? "s" : ""} ·{" "}
              <span className="font-medium text-brand-ink">{formatMoney(owedCents)}</span> owed
            </p>
            {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
          </div>
          {!currentPayout && owedCents > 0 && (
            <button
              onClick={handleFund}
              disabled={funding}
              className="inline-flex items-center gap-2 rounded-full bg-brand-ink text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 transition disabled:opacity-60"
            >
              {funding && <Loader2 size={14} className="animate-spin" />}
              Fund payout
            </button>
          )}
          {currentPayout?.status === "escrowed" && (
            <button
              onClick={handleRelease}
              disabled={funding}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-60"
            >
              {funding ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Release to creator
            </button>
          )}
          {(currentPayout?.status === "released" || currentPayout?.status === "released_pending") && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <CheckCircle2 size={14} />
              Paid
            </span>
          )}
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

function Avatar({ member }) {
  if (member.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={member.avatarUrl}
        alt={member.name}
        className="h-10 w-10 rounded-full object-cover flex-shrink-0"
      />
    );
  }
  return (
    <span className="h-10 w-10 rounded-full bg-brand-mist text-brand-skyDeep flex items-center justify-center text-sm font-semibold flex-shrink-0">
      {member.name?.slice(0, 2).toUpperCase() || "?"}
    </span>
  );
}

function AddCreatorModal({ programId, existingCreatorIds, onClose }) {
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(null);

  useEffect(() => {
    fetchMyCreators()
      .then((rows) =>
        setRoster(
          rows.filter(
            (c) => c.connectionStatus === "active" && !existingCreatorIds.includes(c.id),
          ),
        ),
      )
      .catch(() => setRoster([]))
      .finally(() => setLoading(false));
  }, [existingCreatorIds]);

  const handleAdd = async (creatorId) => {
    setAdding(creatorId);
    try {
      await addProgramMember(programId, creatorId);
      setRoster((prev) => prev.filter((c) => c.id !== creatorId));
    } catch (e) {
      alert(e.message || "Failed to add creator.");
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <p className="font-semibold text-brand-ink">Add creator to program</p>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            ×
          </button>
        </div>
        <div className="p-5 max-h-80 overflow-y-auto space-y-1.5">
          {loading ? (
            <div className="py-8 flex justify-center text-slate-400">
              <Loader2 size={18} className="animate-spin" />
            </div>
          ) : roster.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">
              No more creators available to add from your roster.
            </p>
          ) : (
            roster.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 px-3 py-2 rounded-xl border border-slate-200"
              >
                <span className="h-8 w-8 rounded-full bg-brand-mist text-brand-skyDeep flex items-center justify-center text-xs font-semibold overflow-hidden flex-shrink-0">
                  {c.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.avatarUrl} alt={c.name} className="h-full w-full object-cover" />
                  ) : (
                    c.name?.slice(0, 2).toUpperCase()
                  )}
                </span>
                <span className="flex-1 min-w-0 text-sm font-medium text-brand-ink truncate">
                  {c.name}
                </span>
                <button
                  onClick={() => handleAdd(c.id)}
                  disabled={adding === c.id}
                  className="text-xs font-medium text-brand-skyDeep hover:underline disabled:opacity-60"
                >
                  {adding === c.id ? "Adding…" : "Add"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
