import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import VideoCarousel from "@/components/VideoCarousel";
import StatsBar from "@/components/StatsBar";
import HowItWorks from "@/components/HowItWorks";
import BudgetCalculator from "@/components/BudgetCalculator";
import PricingComparison from "@/components/PricingComparison";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <VideoCarousel />
      <StatsBar />
      <HowItWorks />
      <BudgetCalculator />
      <PricingComparison />
      <FAQ />
      <Footer />
    </main>
  );
}
