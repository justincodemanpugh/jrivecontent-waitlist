"use client";

import { Suspense } from "react";
import ProgramsShell from "@/components/dashboard/brand/programs/ProgramsShell";
import VideosView from "@/components/dashboard/brand/programs/VideosView";

export default function ProgramsVideosPage() {
  return (
    <ProgramsShell
      title="Campaigns"
      heading="Videos"
      subtitle="View and analyze performance metrics across your tracked videos."
    >
      <Suspense fallback={<div className="animate-pulse h-96 bg-surface-hover rounded-2xl" />}>
        <VideosView />
      </Suspense>
    </ProgramsShell>
  );
}
