import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import PlatformStrip from "@/components/PlatformStrip";
import VideoCarousel from "@/components/VideoCarousel";
import TikTokRedistributionFlow from "@/components/TikTokRedistributionFlow";
import StatsBar from "@/components/StatsBar";
import CreatorShowcase from "@/components/CreatorShowcase";
import HowItWorks from "@/components/HowItWorks";
import BudgetCalculator from "@/components/BudgetCalculator";
import PricingComparison from "@/components/PricingComparison";
import FounderNote from "@/components/FounderNote";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

/* The previous homepage, kept reachable here. Not indexed — it's a near
   duplicate of / and shouldn't compete with it in search. */
export const metadata = {
  robots: { index: false, follow: false },
};

export default function ClassicHome() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <PlatformStrip />
      <VideoCarousel />
      <TikTokRedistributionFlow />
      <CreatorShowcase />
      <StatsBar />
      <HowItWorks />
      <BudgetCalculator />
      <PricingComparison />
      <FounderNote />
      <FAQ />
      <Footer />
    </main>
  );
}
