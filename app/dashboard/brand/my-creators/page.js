"use client";

import TopBar from "@/components/dashboard/brand/TopBar";
import MyCreatorsView from "@/components/dashboard/brand/my-creators/MyCreatorsView";

export default function MyCreatorsPage() {
  return (
    <>
      <TopBar title="My Creators" />
      <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-ink">
            My Creators
          </h1>
          <p className="mt-1 text-sm text-muted">
            Your connected creators. Send them briefs and track their content.
          </p>
        </div>
        <MyCreatorsView />
      </main>
    </>
  );
}
