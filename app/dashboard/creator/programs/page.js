"use client";

import { Suspense } from "react";
import TopBar from "@/components/dashboard/creator/TopBar";
import ProgramsListView from "@/components/dashboard/creator/programs/ProgramsListView";

export default function CreatorProgramsPage() {
  return (
    <>
      <TopBar title="Programs" />
      <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-4xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-ink">
            Programs
          </h1>
          <p className="mt-1 text-sm text-muted">
            Connect TikTok to automatically track your video performance for
            brand programs you join.
          </p>
        </div>
        <Suspense fallback={<div className="animate-pulse h-96 bg-surface-hover rounded-2xl" />}>
          <ProgramsListView />
        </Suspense>
      </main>
    </>
  );
}
