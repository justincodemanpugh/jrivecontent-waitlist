import { Suspense } from "react";
import ViralFonts from "@/components/viral/ViralFonts";
import Onboarding from "@/components/start/Onboarding";

export const metadata = {
  title: "Get your creator plan — JriveContent",
  description:
    "Paste your app link, answer a few questions, and get videos to recreate, creators to message and what to post this week.",
};

export default function StartPage() {
  return (
    <ViralFonts>
      <main className="min-h-screen bg-white text-brand-ink">
        {/* Onboarding reads ?app=, which needs a Suspense boundary. */}
        <Suspense fallback={null}>
          <Onboarding />
        </Suspense>
      </main>
    </ViralFonts>
  );
}
