import TopBar from "@/components/dashboard/creator/TopBar";
import GigDetailView from "@/components/dashboard/creator/explore/GigDetailView";

export default function CreatorGigDetailPage({ params }) {
  return (
    <>
      <TopBar title="Gig" />
      <GigDetailView gigId={params.gigId} />
    </>
  );
}
