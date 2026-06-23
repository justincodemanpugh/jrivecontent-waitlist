"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Search,
  Users,
  Send,
  MoreHorizontal,
  Trash2,
  StickyNote,
  UserPlus,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { fetchMyCreators, removeCreatorFromRoster } from "@/lib/dashboard/brand/creatorsApi";
import MyCreatorCard from "./MyCreatorCard";
import NotesDialog from "./NotesDialog";

export default function MyCreatorsView() {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all | active | pending
  const [notesCreator, setNotesCreator] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const reload = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const rows = await fetchMyCreators();
      setCreators(rows);
    } catch (e) {
      setErr(e.message || "Couldn't load creators.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    const refresh = () => reload();
    window.addEventListener("brand-creators:changed", refresh);
    return () => window.removeEventListener("brand-creators:changed", refresh);
  }, [reload]);

  const filtered = useMemo(() => {
    let result = creators;

    // Filter by status
    if (filter === "active") {
      result = result.filter((c) => c.connectionStatus === "active");
    } else if (filter === "pending") {
      result = result.filter((c) => c.connectionStatus === "pending");
    }

    // Search
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter((c) => {
        return (
          c.name.toLowerCase().includes(q) ||
          c.handle.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.niches.some((n) => n.toLowerCase().includes(q))
        );
      });
    }

    return result;
  }, [creators, query, filter]);

  const activeCount = creators.filter((c) => c.connectionStatus === "active").length;
  const pendingCount = creators.filter((c) => c.connectionStatus === "pending").length;

  const handleRemove = async (creator) => {
    if (!confirm(`Remove ${creator.name} from your creators?`)) return;
    try {
      await removeCreatorFromRoster(creator.connectionId);
    } catch (e) {
      alert(e.message || "Failed to remove creator.");
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    const activeIds = filtered
      .filter((c) => c.connectionStatus === "active")
      .map((c) => c.id);
    setSelectedIds(new Set(activeIds));
  };

  const clearSelection = () => setSelectedIds(new Set());

  return (
    <>
      {/* Stats bar */}
      <div className="flex items-center gap-4 text-sm">
        <button
          onClick={() => setFilter("all")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition ${
            filter === "all"
              ? "bg-brand-ink text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Users size={14} />
          All ({creators.length})
        </button>
        <button
          onClick={() => setFilter("active")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition ${
            filter === "active"
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <CheckCircle2 size={14} />
          Active ({activeCount})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition ${
            filter === "pending"
              ? "bg-amber-500 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Clock size={14} />
          Pending ({pendingCount})
        </button>
      </div>

      {/* Search + Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-3 flex items-center gap-2">
          <Search size={16} className="text-slate-400 ml-1" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your creators..."
            className="flex-1 bg-transparent text-sm text-brand-ink placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 ? (
            <>
              <span className="text-sm text-slate-600">
                {selectedIds.size} selected
              </span>
              <Link
                href={`/dashboard/brand/briefs/new?creators=${Array.from(selectedIds).join(",")}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-ink text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 transition"
              >
                <Send size={14} />
                Send Brief
              </Link>
              <button
                onClick={clearSelection}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Clear
              </button>
            </>
          ) : (
            <>
              <Link
                href="/dashboard/brand/creators"
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-brand-ink hover:bg-slate-50 transition"
              >
                <UserPlus size={14} />
                Add Creators
              </Link>
              {activeCount > 0 && (
                <button
                  onClick={selectAll}
                  className="text-sm text-brand-skyDeep hover:underline"
                >
                  Select all
                </button>
              )}
            </>
          )}
        </div>
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
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-mist text-brand-skyDeep mb-3">
            <Users size={20} />
          </span>
          <h2 className="text-lg font-semibold text-brand-ink">
            {creators.length === 0
              ? "No creators yet"
              : "No creators match your search"}
          </h2>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            {creators.length === 0
              ? "Browse creators and send connection requests to build your roster."
              : "Try a different keyword or clear filters."}
          </p>
          {creators.length === 0 && (
            <Link
              href="/dashboard/brand/creators"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-ink text-white px-5 py-2.5 text-sm font-medium hover:bg-slate-800 transition"
            >
              <UserPlus size={16} />
              Browse Creators
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filtered.map((c) => (
            <MyCreatorCard
              key={c.id}
              creator={c}
              selected={selectedIds.has(c.id)}
              onToggleSelect={() => toggleSelect(c.id)}
              onEditNotes={() => setNotesCreator(c)}
              onRemove={() => handleRemove(c)}
            />
          ))}
        </div>
      )}

      {/* Notes dialog */}
      {notesCreator && (
        <NotesDialog
          creator={notesCreator}
          onClose={() => setNotesCreator(null)}
        />
      )}
    </>
  );
}
