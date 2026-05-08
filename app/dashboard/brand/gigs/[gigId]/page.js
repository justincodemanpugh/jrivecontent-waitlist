import TopBar from "@/components/dashboard/brand/TopBar";
import BrandGigDetailView from "@/components/dashboard/brand/gigs/detail/GigDetailView";

export default function BrandGigDetailPage({ params }) {
  return (
    <>
      <TopBar title="Gig" />
      <BrandGigDetailView gigId={params.gigId} />
    </>
  );
}
