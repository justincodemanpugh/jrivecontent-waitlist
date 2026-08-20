"use client";

import { Suspense } from "react";
import ProgramsShell from "@/components/dashboard/brand/programs/ProgramsShell";
import ProgramPayoutsView from "@/components/dashboard/brand/programs/ProgramPayoutsView";

export default function ProgramPayoutsPage() {
  return (
    <ProgramsShell
      title="Payouts"
      heading="Payouts"
      subtitle="Track creator payout statuses across your programs."
    >
      <Suspense fallback={<div className="animate-pulse h-96 bg-surface-hover rounded-2xl" />}>
        <ProgramPayoutsView />
      </Suspense>
    </ProgramsShell>
  );
}
