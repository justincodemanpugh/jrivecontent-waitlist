import { Suspense } from "react";
import ViralFonts from "@/components/viral/ViralFonts";
import ViralNavbar from "@/components/viral/ViralNavbar";
import VibecodeHero from "@/components/vibecode/VibecodeHero";
import VibecodeSteps from "@/components/vibecode/VibecodeSteps";
import ViralPricing from "@/components/viral/ViralPricing";
import FounderNote from "@/components/FounderNote";
import VibecodeFAQ from "@/components/vibecode/VibecodeFAQ";
import ViralFooter from "@/components/viral/ViralFooter";

// Landing page for people who built an app fast (Lovable, Bolt, Cursor,
// Replit, plain old Xcode) and have no idea how to get users.
//
// Kept separate from `/` on purpose: the homepage sells the broader UGC
// platform to small brands and has its own SEO, and this page narrows hard
// to one audience so Reddit and X traffic lands somewhere that speaks their
// language. Shared sections (pricing, founder note, nav, footer) are reused
// verbatim; the hero, steps and FAQ are the builder-specific forks.
//
// Note what is deliberately absent: StatsBar and OperatingSystem, whose
// numbers are aspirational placeholders. There is no case-study proof yet,
// so this page's proof is the live scan — you paste your own app and see
// real creators and real concepts for it.

export const metadata = {
  title: "JriveContent — Marketing for the app you just built",
  description:
    "Paste your app link and see the TikToks already working in your niche, plus the small creators making them. Built for solo devs shipping fast with no marketing budget.",
};

export default function VibecodePage() {
  return (
    <ViralFonts>
      <main className="min-h-screen bg-white text-brand-ink">
        <ViralNavbar />
        {/* VibecodeHero reads ?app= to re-run a scan after signup, and
            useSearchParams needs a Suspense boundary to prerender. */}
        <Suspense fallback={<div className="min-h-[60vh] bg-brand-mist/40" />}>
          <VibecodeHero />
        </Suspense>
        <VibecodeSteps />
        <ViralPricing />
        <FounderNote />
        <VibecodeFAQ />
        <ViralFooter />
      </main>
    </ViralFonts>
  );
}
