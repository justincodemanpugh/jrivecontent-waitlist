"use client";

import { Suspense } from "react";
import TopBar from "@/components/dashboard/brand/TopBar";
import NewBriefForm from "@/components/dashboard/brand/briefs/NewBriefForm";

export default function NewBriefPage() {
  return (
    <>
      <TopBar title="Send New Brief" />
      <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto">
        <Suspense fallback={<div className="animate-pulse h-96 bg-slate-100 rounded-2xl" />}>
          <NewBriefForm />
        </Suspense>
      </main>
    </>
  );
}
