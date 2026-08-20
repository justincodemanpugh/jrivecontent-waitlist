"use client";

import { Suspense } from "react";
import ProgramsShell from "@/components/dashboard/brand/programs/ProgramsShell";
import ProgramsListView from "@/components/dashboard/brand/programs/ProgramsListView";

export default function ProgramsManagePage() {
  return (
    <ProgramsShell
      title="Programs"
      heading="Programs"
      subtitle="Manage cadence, video targets, and creator payouts."
    >
      <Suspense fallback={<div className="animate-pulse h-96 bg-surface-hover rounded-2xl" />}>
        <ProgramsListView />
      </Suspense>
    </ProgramsShell>
  );
}
