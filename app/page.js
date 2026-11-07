import ViralFonts from "@/components/viral/ViralFonts";
import ViralNavbar from "@/components/viral/ViralNavbar";
import ViralHero from "@/components/viral/ViralHero";
import StatsBar from "@/components/StatsBar";
import VideoCarousel from "@/components/VideoCarousel";
import HowItWorks from "@/components/viral/HowItWorks";
import AppTypes from "@/components/viral/AppTypes";
import OperatingSystem from "@/components/viral/OperatingSystem";
import CreatorManagement from "@/components/viral/CreatorManagement";
import ViralPricing from "@/components/viral/ViralPricing";
import FounderNote from "@/components/FounderNote";
import ViralFAQ from "@/components/viral/ViralFAQ";
import ViralFooter from "@/components/viral/ViralFooter";

export const metadata = {
  title: "JriveContent — You built it. Now let's get you users.",
  description:
    "Get users for your app or SaaS with UGC creators on TikTok. Creators post videos about your product and you only pay for the views they get. Pay $0 today.",
};

export default function Home() {
  return (
    <ViralFonts>
      <main className="min-h-screen bg-white text-brand-ink">
        <ViralNavbar />
        <ViralHero />
        <StatsBar />
        <VideoCarousel />
        <HowItWorks />
        <AppTypes />
        <OperatingSystem />
        <CreatorManagement />
        <ViralPricing />
        <FounderNote />
        <ViralFAQ />
        <ViralFooter />
      </main>
    </ViralFonts>
  );
}
