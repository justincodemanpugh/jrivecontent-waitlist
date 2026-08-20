"use client";

import TopBar from "@/components/dashboard/brand/TopBar";
import CreatorsView from "@/components/dashboard/brand/creators/CreatorsView";

export default function BrandCreatorsPage() {
  return (
    <>
      <TopBar title="Browse Creators" />
      <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-ink">
            Find your next collaborator
          </h1>
          <p className="mt-1 text-sm text-muted">
            Browse every creator on the platform, preview their work, and connect to add them to your team.
          </p>
        </div>
        <CreatorsView />
      </main>
    </>
  );
}
