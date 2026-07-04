"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Plus,
  TrendingUp,
  Users,
  Film,
  MoreHorizontal,
  Archive,
  Pause,
  Play,
  ExternalLink,
} from "lucide-react";
import {
  fetchMyPrograms,
  archiveProgram,
  pauseProgram,
  reactivateProgram,
} from "@/lib/dashboard/brand/programsApi";
import CreateProgramModal from "@/components/dashboard/brand/programs/CreateProgramModal";

function centsToDollars(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

export default function ProgramsListView() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const rows = await fetchMyPrograms();
      setPrograms(rows);
    } catch (e) {
      setErr(e.message || "Couldn't load programs.");
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

  const livePrograms = programs.filter((p) => p.status !== "archived");
  const archivedPrograms = programs.filter((p) => p.status === "archived");
  const displayPrograms = showArchived ? archivedPrograms : livePrograms;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowArchived(false)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              !showArchived
                ? "bg-brand-ink text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Active ({livePrograms.length})
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              showArchived
                ? "bg-brand-ink text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Archived ({archivedPrograms.length})
          </button>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-ink text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 transition"
        >
          <Plus size={14} />
          Create Program
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : err ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>
      ) : displayPrograms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-mist text-brand-skyDeep mb-3">
            <TrendingUp size={20} />
          </span>
          <h2 className="text-lg font-semibold text-brand-ink">
            {showArchived ? "No archived programs" : "No programs yet"}
          </h2>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            {showArchived
              ? "Archived programs will appear here."
              : "Set up a recurring TikTok program — video quota, per-video pay, and a payout schedule — and track every creator's performance automatically."}
          </p>
          {!showArchived && (
            <button
              onClick={() => setCreateOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-ink text-white px-5 py-2.5 text-sm font-medium hover:bg-slate-800 transition"
            >
              <Plus size={16} />
              Create Your First Program
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayPrograms.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      )}

      {createOpen && <CreateProgramModal onClose={() => setCreateOpen(false)} />}
    </div>
  );
}

function ProgramCard({ program }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleAction = async (action) => {
    setMenuOpen(false);
    try {
      if (action === "archive") await archiveProgram(program.id);
      if (action === "pause") await pauseProgram(program.id);
      if (action === "reactivate") await reactivateProgram(program.id);
    } catch (e) {
      alert(e.message || "Action failed.");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-brand-ink truncate">{program.title}</h3>
            {program.status === "paused" && (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                Paused
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">
            {program.description || "No description"}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-semibold text-emerald-600">
            {centsToDollars(program.payPerVideoCents)}/video
          </span>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-1 w-44 rounded-xl border border-slate-200 bg-white shadow-lg py-1 z-20">
                  <Link
                    href={`/dashboard/brand/programs/${program.id}`}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <ExternalLink size={14} />
                    View Details
                  </Link>
                  {program.status === "active" && (
                    <button
                      onClick={() => handleAction("pause")}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Pause size={14} />
                      Pause
                    </button>
                  )}
                  {program.status === "paused" && (
                    <button
                      onClick={() => handleAction("reactivate")}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Play size={14} />
                      Reactivate
                    </button>
                  )}
                  {program.status !== "archived" && (
                    <button
                      onClick={() => handleAction("archive")}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Archive size={14} />
                      Archive
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Users size={12} />
          {program.activeMembersCount} active creator
          {program.activeMembersCount !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1">
          <Film size={12} />
          {program.videosPerPeriod} video{program.videosPerPeriod !== 1 ? "s" : ""}/
          {program.periodType}
        </span>
        <span className="flex items-center gap-1">
          <TrendingUp size={12} />
          {new Intl.NumberFormat("en-US", { notation: "compact" }).format(program.totalViews)}{" "}
          views
        </span>
        <span className="ml-auto capitalize">{program.payoutSchedule} payouts</span>
      </div>

      <Link
        href={`/dashboard/brand/programs/${program.id}`}
        className="mt-3 inline-block text-xs font-medium text-brand-skyDeep hover:underline"
      >
        View program →
      </Link>
    </div>
  );
}
