"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import TopBar from "@/components/dashboard/brand/TopBar";
import CreatorsView from "@/components/dashboard/brand/creators/CreatorsView";
import { fetchBilling } from "@/lib/dashboard/brand/billingApi";
import { fetchFreeTierUsage } from "@/lib/dashboard/brand/gigsApi";

export default function BrandCreatorsPage() {
  const router = useRouter();
  const [checkingPro, setCheckingPro] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [billing, freeUsage] = await Promise.all([
          fetchBilling(),
          fetchFreeTierUsage(),
        ]);
        if (!cancelled) {
          const isPro = billing?.plan === "pro";
          const hasFreeInviteRemaining = freeUsage?.invites?.remaining > 0;
          if (!isPro && !hasFreeInviteRemaining) {
            router.replace("/dashboard/brand/pricing?from=browse-creators");
          } else {
            setCheckingPro(false);
          }
        }
      } catch {
        if (!cancelled) router.replace("/dashboard/brand/pricing?from=browse-creators");
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  if (checkingPro) {
    return (
      <>
        <TopBar title="Browse Creators" />
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-slate-400" />
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="Browse Creators" />
      <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-brand-ink">
            Find your next collaborator
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Browse every creator on the platform, preview their work, and
            invite them straight to one of your gigs.
          </p>
        </div>
        <CreatorsView />
      </main>
    </>
  );
}
