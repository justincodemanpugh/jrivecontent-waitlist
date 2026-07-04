"use client";

import { Suspense } from "react";
import ProgramsShell from "@/components/dashboard/brand/programs/ProgramsShell";
import AccountsView from "@/components/dashboard/brand/programs/AccountsView";

export default function ProgramsAccountsPage() {
  return (
    <ProgramsShell
      title="Programs"
      heading="Accounts"
      subtitle="View and analyze performance metrics across your tracked accounts."
    >
      <Suspense fallback={<div className="animate-pulse h-96 bg-slate-100 rounded-2xl" />}>
        <AccountsView />
      </Suspense>
    </ProgramsShell>
  );
}
