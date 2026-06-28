"use client";

import { useParams } from "next/navigation";
import TopBar from "@/components/dashboard/creator/TopBar";
import AssignmentDetailView from "@/components/dashboard/creator/assignments/AssignmentDetailView";

export default function AssignmentDetailPage() {
  const params = useParams();
  const recipientId = params?.recipientId;

  return (
    <>
      <TopBar title="Assignment" />
      <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto">
        <AssignmentDetailView recipientId={recipientId} />
      </main>
    </>
  );
}
