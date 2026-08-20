"use client";

import { Suspense, useState } from "react";
import { UserPlus } from "lucide-react";
import ProgramsShell from "@/components/dashboard/brand/programs/ProgramsShell";
import AccountsView from "@/components/dashboard/brand/programs/AccountsView";
import TrackAccountsModal from "@/components/dashboard/brand/programs/TrackAccountsModal";

export default function ProgramsAccountsPage() {
  const [tracking, setTracking] = useState(false);

  return (
    <>
      <ProgramsShell
        title="Programs"
        heading="Accounts"
        subtitle="View and analyze performance metrics across your tracked accounts."
        action={
          <button
            onClick={() => setTracking(true)}
            className="inline-flex items-center gap-2 rounded-full bg-ink text-on-accent px-5 py-2.5 text-sm font-medium hover:bg-ink/90 transition"
          >
            <UserPlus size={15} />
            Track Account
          </button>
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
