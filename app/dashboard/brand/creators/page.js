"use client";

import { useState } from "react";
import TopBar from "@/components/dashboard/brand/TopBar";
import CreatorsView from "@/components/dashboard/brand/creators/CreatorsView";
import DiscoveryView from "@/components/dashboard/brand/creators/DiscoveryView";

// Two sources of creators, deliberately kept as separate tabs rather than one
// merged list: members can be connected, invited to a campaign and paid, while
// directory profiles are scraped public accounts with none of that. Blending
// them into one grid would imply the second group is hireable here.
const TABS = [
  { id: "members", label: "On JriveContent" },
  { id: "directory", label: "TikTok directory" },
];

export default function BrandCreatorsPage() {
  const [tab, setTab] = useState("members");

  return (
    <>
      <TopBar title="Browse Creators" />
      <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-ink">
            Find your next collaborator
          </h1>
          <p className="mt-1 text-sm text-muted">
            {tab === "members"
              ? "Browse every creator on the platform, preview their work, and connect to add them to your team."
              : "Search TikTok creators we've discovered publicly. They're not on JriveContent yet — open their profile to reach out."}
          </p>
        </div>

        <div className="flex gap-1 rounded-full border border-line bg-surface-sunken p-1 w-fit">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                tab === t.id
                  ? "bg-surface text-ink shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "members" ? <CreatorsView /> : <DiscoveryView />}
      </main>
    </>
  );
}
