"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Users } from "lucide-react";
import {
  fetchAllCreators,
  fetchConnectionStatusForCreators,
  connectWithCreator,
} from "@/lib/dashboard/brand/creatorsApi";
import { fetchBilling } from "@/lib/dashboard/brand/billingApi";
import CreatorCard from "./CreatorCard";
import CreatorProfileModal from "./CreatorProfileModal";

// Top-level browse page. Fetches all onboarded creators + the brand's
// connection status so cards can show "Connected" or "Pending".
export default function CreatorsView() {
  const router = useRouter();
  const [creators, setCreators] = useState([]);
  const [connectionMap, setConnectionMap] = useState(new Map()); // creatorId -> status
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");
  const [openCreator, setOpenCreator] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [connecting, setConnecting] = useState(null); // creatorId being connected

  async function reload() {
    setLoading(true);
    setErr("");
    try {
      const [rows, billing] = await Promise.all([
        fetchAllCreators(),
        fetchBilling(),
      ]);
      setCreators(rows);
      setIsPro(billing?.plan === "pro");
      const ids = rows.map((r) => r.id);
      const connections = await fetchConnectionStatusForCreators(ids);
      const map = new Map();
      for (const c of connections) {
        map.set(c.creator_id, c.status);
      }
      setConnectionMap(map);
    } catch (e) {
      setErr(e.message || "Couldn't load creators.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    function refresh() {
      reload();
    }
    if (typeof window !== "undefined") {
      window.addEventListener("brand-creators:changed", refresh);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("brand-creators:changed", refresh);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async (creator) => {
    setConnecting(creator.id);
    try {
      await connectWithCreator(creator.id);
      // Optimistically update the map
      setConnectionMap((prev) => {
        const next = new Map(prev);
        next.set(creator.id, "pending");
        return next;
      });
    } catch (e) {
      alert(e.message || "Failed to connect.");
    } finally {
      setConnecting(null);
    }
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return creators;
    const q = query.trim().toLowerCase();
    return creators.filter((c) => {
      return (
        c.name.toLowerCase().includes(q) ||
        c.handle.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.niches.some((n) => n.toLowerCase().includes(q)) ||
        c.bio.toLowerCase().includes(q)
      );
    });
  }, [creators, query]);

  return (
    <>
      {/* Search */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 flex items-center gap-2">
        <Search size={16} className="text-slate-400 ml-1" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search creators by name, niche, or location"
          className="flex-1 bg-transparent text-sm text-brand-ink placeholder:text-slate-400 focus:outline-none"
        />
        <span className="text-xs text-slate-400 hidden sm:inline">
          {filtered.length} {filtered.length === 1 ? "creator" : "creators"}
        </span>
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
            No creators match your search
          </h2>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            Try a different keyword or clear the search to see everyone on the
            platform.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filtered.map((c) => (
            <CreatorCard
              key={c.id}
              creator={c}
              connectionStatus={connectionMap.get(c.id) || null}
              isPro={isPro}
              onOpen={(creator) => setOpenCreator(creator)}
              onConnect={handleConnect}
            />
          ))}
        </div>
      )}

      {/* Profile modal */}
      {openCreator ? (
        <CreatorProfileModal
          creator={openCreator}
          connectionStatus={connectionMap.get(openCreator.id) || null}
          isPro={isPro}
          onClose={() => setOpenCreator(null)}
          onConnect={handleConnect}
        />
      ) : null}
    </>
  );
}
