"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Loader2,
  Send,
  FileText,
  Users,
  Clock,
  CheckCircle2,
  Eye,
  MoreHorizontal,
  Archive,
  ExternalLink,
} from "lucide-react";
import { fetchMyBriefs, archiveBrief } from "@/lib/dashboard/brand/briefsApi";

export default function BriefsListView() {
  const searchParams = useSearchParams();
  const justSent = searchParams?.get("sent") === "1";

  const [briefs, setBriefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const rows = await fetchMyBriefs();
      setBriefs(rows);
    } catch (e) {
      setErr(e.message || "Couldn't load briefs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    const refresh = () => reload();
    window.addEventListener("briefs:changed", refresh);
    return () => window.removeEventListener("briefs:changed", refresh);
  }, [reload]);

  const handleArchive = async (brief) => {
    if (!confirm(`Archive "${brief.title}"?`)) return;
    try {
      await archiveBrief(brief.id);
    } catch (e) {
      alert(e.message || "Failed to archive brief.");
    }
  };

  const activeBriefs = briefs.filter((b) => b.status === "active");
  const archivedBriefs = briefs.filter((b) => b.status === "archived");
  const displayBriefs = showArchived ? archivedBriefs : activeBriefs;

  return (
    <>
      {/* Success banner */}
      {justSent && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center gap-3">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <p className="text-sm text-emerald-700">
            Brief sent successfully! Your creators will be notified.
          </p>
        </div>
      )}

      {/* Actions */}
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
            Active ({activeBriefs.length})
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              showArchived
                ? "bg-brand-ink text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Archived ({archivedBriefs.length})
          </button>
        </div>

        <Link
          href="/dashboard/brand/briefs/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-ink text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 transition"
        >
          <Send size={14} />
          Send New Brief
        </Link>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : err ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {err}
        </p>
      ) : displayBriefs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-mist text-brand-skyDeep mb-3">
            <FileText size={20} />
          </span>
          <h2 className="text-lg font-semibold text-brand-ink">
            {showArchived ? "No archived briefs" : "No briefs yet"}
          </h2>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            {showArchived
              ? "Archived briefs will appear here."
              : "Send your first brief to start distributing content to your creators."}
          </p>
          {!showArchived && (
            <Link
              href="/dashboard/brand/briefs/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-ink text-white px-5 py-2.5 text-sm font-medium hover:bg-slate-800 transition"
            >
              <Send size={16} />
              Send Your First Brief
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayBriefs.map((brief) => (
            <BriefCard
              key={brief.id}
              brief={brief}
              onArchive={() => handleArchive(brief)}
            />
          ))}
        </div>
      )}
    </>
  );
}

function BriefCard({ brief, onArchive }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const totalRecipients = brief.recipients.length;
  const viewedCount = brief.recipients.filter((r) => r.viewedAt).length;
  const completedCount = brief.recipients.filter(
    (r) => r.status === "completed"
  ).length;

  const createdDate = new Date(brief.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-brand-ink truncate">
            {brief.title}
          </h3>
          <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">
            {brief.instructions || "No instructions provided"}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {brief.payPerCreator && (
            <span className="text-sm font-semibold text-emerald-600">
              ${brief.payPerCreator}
            </span>
          )}

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <MoreHorizontal size={16} />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-40 rounded-xl border border-slate-200 bg-white shadow-lg py-1 z-20">
                  <Link
                    href={`/dashboard/brand/briefs/${brief.id}`}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <ExternalLink size={14} />
                    View Details
                  </Link>
                  {brief.status === "active" && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onArchive();
                      }}
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

      {/* Stats */}
      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Users size={12} />
          {totalRecipients} creator{totalRecipients !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1">
          <Eye size={12} />
          {viewedCount} viewed
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 size={12} />
          {completedCount} completed
        </span>
        <span className="flex items-center gap-1 ml-auto">
          <Clock size={12} />
          {createdDate}
        </span>
      </div>

      {/* Recipients preview */}
      {brief.recipients.length > 0 && (
        <div className="mt-3 flex items-center gap-1">
          {brief.recipients.slice(0, 5).map((r) => (
            <div
              key={r.id}
              className="h-7 w-7 rounded-full border-2 border-white -ml-1 first:ml-0 overflow-hidden"
              title={r.name}
            >
              {r.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.avatarUrl}
                  alt={r.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="h-full w-full bg-brand-mist text-brand-skyDeep flex items-center justify-center text-[10px] font-semibold">
                  {r.name?.slice(0, 2).toUpperCase() || "?"}
                </span>
              )}
            </div>
          ))}
          {brief.recipients.length > 5 && (
            <span className="text-xs text-slate-400 ml-1">
              +{brief.recipients.length - 5} more
            </span>
          )}
        </div>
      )}

      {/* Example videos count */}
      {brief.exampleVideos.length > 0 && (
        <p className="mt-2 text-xs text-slate-400">
          {brief.exampleVideos.length} example video
          {brief.exampleVideos.length !== 1 ? "s" : ""} attached
        </p>
      )}
    </div>
  );
}
