import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import PainPoints from "@/components/PainPoints";
import HowItWorks from "@/components/HowItWorks";
import PricingComparison from "@/components/PricingComparison";
import WaitlistCTA from "@/components/WaitlistCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <PricingComparison />
      <HowItWorks />
      <PainPoints />
      <WaitlistCTA />
      <Footer />
    </main>
  );
}
