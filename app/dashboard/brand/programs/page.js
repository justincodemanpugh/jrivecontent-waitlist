"use client";

import { Suspense } from "react";
import ProgramsShell from "@/components/dashboard/brand/programs/ProgramsShell";
import OverviewView from "@/components/dashboard/brand/programs/OverviewView";

export default function ProgramsOverviewPage() {
  return (
    <ProgramsShell
      title="Programs"
      heading="Overview"
      subtitle="Track every creator's TikTok performance in one place."
    >
      <Suspense fallback={<div className="animate-pulse h-96 bg-slate-100 rounded-2xl" />}>
        <OverviewView />
      </Suspense>
    </ProgramsShell>
  );
}
