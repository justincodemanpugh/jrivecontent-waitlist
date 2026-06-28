"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import TopBar from "@/components/dashboard/brand/TopBar";
import BriefDetailView from "@/components/dashboard/brand/briefs/BriefDetailView";

export default function BriefDetailPage() {
  const params = useParams();
  const briefId = params?.id;

  return (
    <>
      <TopBar title="Brief" />
      <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-5xl mx-auto">
        <Suspense
          fallback={
            <div className="animate-pulse h-96 bg-slate-100 rounded-2xl" />
          }
        >
          <BriefDetailView briefId={briefId} />
        </Suspense>
      </main>
    </>
  );
}
