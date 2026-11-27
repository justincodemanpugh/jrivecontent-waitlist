import ViralFonts from "@/components/viral/ViralFonts";
import ViralNavbar from "@/components/viral/ViralNavbar";
import ViralHero from "@/components/viral/ViralHero";
import AppTypes from "@/components/viral/AppTypes";
import Proof from "@/components/viral/Proof";
import WhyItWorks from "@/components/viral/WhyItWorks";
import FounderNote from "@/components/FounderNote";
import ViralPricing from "@/components/viral/ViralPricing";
import ViralFAQ from "@/components/viral/ViralFAQ";
import LinkBox from "@/components/viral/LinkBox";
import ViralFooter from "@/components/viral/ViralFooter";

export const metadata = {
  title: "JriveContent — Get creators posting about your app",
  description:
    "Paste your app link and get videos to recreate, creators to message, what to send them and what to post this week.",
};

export default function Home() {
  return (
    <ViralFonts>
      <main className="min-h-screen bg-white text-brand-ink">
        <ViralNavbar />
        <ViralHero />
        <AppTypes />
        <Proof />
        <WhyItWorks />
        <FounderNote />
        <ViralPricing />
        <ViralFAQ />
        <section className="px-6 py-20 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-brand-ink sm:text-5xl">
            Start with your link
          </h2>
          <div className="mt-8">
            <LinkBox id="app-link-bottom" />
          </div>
        </section>
        <ViralFooter />
      </main>
    </ViralFonts>
  );
}
