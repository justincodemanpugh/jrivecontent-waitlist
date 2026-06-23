"use client";

import { Suspense } from "react";
import TopBar from "@/components/dashboard/brand/TopBar";
import BriefsListView from "@/components/dashboard/brand/briefs/BriefsListView";

export default function BriefsPage() {
  return (
    <>
      <TopBar title="Briefs" />
      <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-brand-ink">
            Briefs
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Track your sent briefs and creator submissions.
          </p>
        </div>
        <Suspense fallback={<div className="animate-pulse h-96 bg-slate-100 rounded-2xl" />}>
          <BriefsListView />
        </Suspense>
      </main>
    </>
  );
}
