import ViralFonts from "@/components/viral/ViralFonts";
import ViralNavbar from "@/components/viral/ViralNavbar";
import ViralHero from "@/components/viral/ViralHero";
import StatsBar from "@/components/StatsBar";
import VideoCarousel from "@/components/VideoCarousel";
import HowItWorks from "@/components/viral/HowItWorks";
import OperatingSystem from "@/components/viral/OperatingSystem";
import CreatorManagement from "@/components/viral/CreatorManagement";
import ViralPricing from "@/components/viral/ViralPricing";
import FounderNote from "@/components/FounderNote";
import ViralFAQ from "@/components/viral/ViralFAQ";
import ViralFooter from "@/components/viral/ViralFooter";

export const metadata = {
  title: "JriveContent — Track every video. Pay for real results.",
  description:
    "Track, manage, and pay UGC creators on TikTok. See every video, pay for what performs, and scale your creator campaigns. Pay $0 today.",
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
