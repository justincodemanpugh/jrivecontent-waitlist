"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Inbox, Loader2 } from "lucide-react";

import TopBar from "@/components/dashboard/brand/TopBar";
import GigsTabs from "@/components/dashboard/brand/gigs/list/GigsTabs";
import GigListCard from "@/components/dashboard/brand/gigs/list/GigListCard";
import ConfirmDialog from "@/components/dashboard/brand/gigs/list/ConfirmDialog";
import {
  fetchMyGigs,
  deactivateGig,
  deleteGig,
} from "@/lib/dashboard/brand/gigsApi";

export default function BrandGigsPage() {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState("active");
  const [pendingDeactivate, setPendingDeactivate] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchMyGigs();
        if (!cancelled) setGigs(rows);
      } catch (err) {
        if (!cancelled) setLoadError(err?.message || "Couldn't load gigs.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(
    () => ({
      active: gigs.filter((g) => g.isActive).length,
      deactivated: gigs.filter((g) => !g.isActive).length,
    }),
    [gigs],
  );

  const visible = useMemo(
    () =>
      gigs.filter((g) => (tab === "active" ? g.isActive : !g.isActive)),
    [gigs, tab],
  );

  const confirmDeactivate = async () => {
    if (!pendingDeactivate) return;
    const id = pendingDeactivate.id;
    setPendingDeactivate(null);
    setGigs((prev) =>
      prev.map((g) => (g.id === id ? { ...g, isActive: false } : g)),
    );
    try {
      await deactivateGig(id);
    } catch (err) {
      // Revert on failure
      setGigs((prev) =>
        prev.map((g) => (g.id === id ? { ...g, isActive: true } : g)),
      );
      setLoadError(err?.message || "Couldn't deactivate gig.");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    setGigs((prev) => prev.filter((g) => g.id !== target.id));
    try {
      await deleteGig(target.id);
    } catch (err) {
      setGigs((prev) => [target, ...prev]);
      setLoadError(err?.message || "Couldn't delete gig.");
    }
  };

  return (
    <>
      <TopBar title="Gigs" />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-brand-ink md:text-3xl">
              My gigs
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage what&apos;s live and what&apos;s been wrapped up.
            </p>
          </div>
          <Link
            href="/dashboard/brand/gigs/new"
            className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-ink px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus size={16} />
            New gig
          </Link>
        </div>

        <GigsTabs value={tab} onChange={setTab} counts={counts} />

        {loadError && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {loadError}
          </p>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <EmptyTab tab={tab} />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((gig) => (
              <GigListCard
                key={gig.id}
                gig={gig}
                onDeactivate={setPendingDeactivate}
                onDelete={setPendingDelete}
              />
            ))}
          </div>
        )}
      </main>

      <ConfirmDialog
        open={!!pendingDeactivate}
        title="Deactivate this gig?"
        description={
          <div className="space-y-2">
            <p>
              <span className="font-medium text-brand-ink">
                {pendingDeactivate?.title}
              </span>{" "}
              will be removed from the creator marketplace and any open
              applications will be notified that it&apos;s closed.
            </p>
            <p className="text-slate-500">
              You can delete it permanently afterward. Gigs can&apos;t be
              reactivated or edited once published.
            </p>
          </div>
        }
        confirmLabel="Deactivate"
        onConfirm={confirmDeactivate}
        onClose={() => setPendingDeactivate(null)}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this gig?"
        description={
          <p>
            <span className="font-medium text-brand-ink">
              {pendingDelete?.title}
            </span>{" "}
            will be permanently deleted. This can&apos;t be undone.
          </p>
        }
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </>
  );
}

function EmptyTab({ tab }) {
  const isActive = tab === "active";
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-16 text-center">
      <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-mist text-brand-skyDeep">
        <Inbox size={20} />
      </div>
      <h3 className="text-sm font-semibold text-brand-ink">
        {isActive ? "No active gigs yet" : "Nothing deactivated"}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        {isActive
          ? "Post your first gig and creators can start applying within minutes."
          : "Gigs you deactivate will show up here."}
      </p>
      {isActive && (
        <Link
          href="/dashboard/brand/gigs/new"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Plus size={16} />
          New gig
        </Link>
      )}
    </div>
  );
}
