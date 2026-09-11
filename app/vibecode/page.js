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
// platform to small brands and has its own SEO, and this page narrows hard to
// one audience so Reddit and X traffic lands somewhere that speaks their
// language.
//
// The marketing sections are passed to VibecodeHero as children rather than
// rendered as siblings, because it unmounts them once a scan returns results
// — someone looking at their own creator list should not have to scroll past
// pricing and an FAQ to reach it.
//
// Note what is deliberately absent: StatsBar and OperatingSystem, whose
// numbers are aspirational placeholders. There is no case-study proof yet, so
// this page's proof is the live scan — you paste your own app and see real
// creators and real posts for it.

export const metadata = {
  title: "JriveContent — Marketing for the app you just built",
  description:
    "Paste your app link and see the TikToks already working in your niche, plus the creators who'll make them for you. Built for solo devs shipping fast with no marketing budget.",
};

export default function VibecodePage() {
  return (
    <ViralFonts>
      <main className="min-h-screen bg-white text-brand-ink">
        <ViralNavbar />
        {/* VibecodeHero reads ?app= to re-run a scan after signup, and
            useSearchParams needs a Suspense boundary to prerender. */}
        <Suspense fallback={<div className="min-h-[60vh] bg-brand-mist/40" />}>
          <VibecodeHero>
            <VibecodeSteps />
            <ViralPricing />
            <FounderNote />
            <VibecodeFAQ />
          </VibecodeHero>
        </Suspense>
        <ViralFooter />
      </main>
    </ViralFonts>
  );
}
