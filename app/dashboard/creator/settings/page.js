"use client";

import TopBar from "@/components/dashboard/creator/TopBar";
import DeleteAccountCard from "@/components/dashboard/DeleteAccountCard";

export default function CreatorSettingsPage() {
  return (
    <>
      <TopBar title="Settings" />
      <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-brand-ink">
            Settings
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage your account preferences.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Danger zone
          </h2>
          <DeleteAccountCard role="creator" />
        </section>
      </main>
    </>
  );
}
