"use client";

import TopBar from "@/components/dashboard/creator/TopBar";
import AssignmentsListView from "@/components/dashboard/creator/assignments/AssignmentsListView";

export default function AssignmentsPage() {
  return (
    <>
      <TopBar title="Assignments" />
      <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-4xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-ink">
            Assignments
          </h1>
          <p className="mt-1 text-sm text-muted">
            Briefs brands have sent you. Once payment is secured, upload your
            video to get paid.
          </p>
        </div>
        <AssignmentsListView />
      </main>
    </>
  );
}
