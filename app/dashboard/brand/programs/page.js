"use client";

import { Suspense } from "react";
import ProgramsShell from "@/components/dashboard/brand/programs/ProgramsShell";
import OverviewView from "@/components/dashboard/brand/programs/OverviewView";
import PayingByCreator from "@/components/dashboard/brand/programs/PayingByCreator";

export default function ProgramsOverviewPage() {
  return (
    <ProgramsShell
      title="Results"
      heading="Results"
      subtitle="Track every creator's TikTok performance in one place."
    >
      <Suspense fallback={<div className="animate-pulse h-96 bg-surface-hover rounded-2xl" />}>
        <OverviewView />
      </Suspense>
      <PayingByCreator />
    </ProgramsShell>
  );
}
