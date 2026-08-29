"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { UserPlus, Lock } from "lucide-react";
import ProgramsShell from "@/components/dashboard/brand/programs/ProgramsShell";
import AccountsView from "@/components/dashboard/brand/programs/AccountsView";
import TrackAccountsModal from "@/components/dashboard/brand/programs/TrackAccountsModal";
import { fetchBilling } from "@/lib/dashboard/brand/billingApi";

export default function ProgramsAccountsPage() {
  const [tracking, setTracking] = useState(false);
  // Tracking spends Apify credits, so it's gated behind the trial — enforced
  // server-side in /api/tracked-accounts. Optimistic default avoids a lock
  // flashing for paying brands while billing loads.
  const [canTrack, setCanTrack] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchBilling()
      .then((b) => {
        if (!cancelled) setCanTrack(b.plan === "pro");
      })
      .catch(() => {
        // Leave enabled; the API returns a clear 402 if it isn't allowed.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <ProgramsShell
        title="Campaigns"
        heading="Accounts"
        subtitle="View and analyze performance metrics across your tracked accounts."
        action={
          canTrack ? (
            <button
              onClick={() => setTracking(true)}
              className="inline-flex items-center gap-2 rounded-full bg-ink text-on-accent px-5 py-2.5 text-sm font-medium hover:bg-ink/90 transition"
            >
              <UserPlus size={15} />
              Track Account
            </button>
          ) : (
            <Link
              href="/dashboard/brand/pricing?from=track-accounts"
              className="inline-flex items-center gap-2 rounded-full bg-ink text-on-accent px-5 py-2.5 text-sm font-medium hover:bg-ink/90 transition"
            >
              <Lock size={15} />
              Start Free Trial
            </Link>
          )
        }
      >
        <Suspense fallback={<div className="animate-pulse h-96 bg-surface-hover rounded-2xl" />}>
          <AccountsView />
        </Suspense>
      </ProgramsShell>

      {/* AccountsView reloads itself off the `tracked-accounts:changed` event
          the API layer dispatches, so no callback wiring is needed here. */}
      {tracking && <TrackAccountsModal onClose={() => setTracking(false)} />}
    </>
  );
}
