import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import VideoCarousel from "@/components/VideoCarousel";
import PainPoints from "@/components/PainPoints";
import HowItWorks from "@/components/HowItWorks";
import PricingComparison from "@/components/PricingComparison";
import WaitlistCTA from "@/components/WaitlistCTA";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <VideoCarousel />
      <PricingComparison />
      <HowItWorks />
      <PainPoints />
      <WaitlistCTA />
      <FAQ />
      <Footer />
    </main>
  );
}
