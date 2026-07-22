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

export default function Home() {
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
