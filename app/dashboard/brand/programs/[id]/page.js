"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import ProgramsShell from "@/components/dashboard/brand/programs/ProgramsShell";
import ProgramDetailView from "@/components/dashboard/brand/programs/ProgramDetailView";

export default function ProgramDetailPage() {
  const params = useParams();
  const programId = params?.id;

  return (
    <ProgramsShell title="Program">
      <Suspense fallback={<div className="animate-pulse h-96 bg-slate-100 rounded-2xl" />}>
        <ProgramDetailView programId={programId} />
      </Suspense>
    </ProgramsShell>
  );
}
