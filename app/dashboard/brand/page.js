import TopBar from "@/components/dashboard/brand/TopBar";
import WeekView from "@/components/dashboard/brand/week/WeekView";

export default function BrandDashboardPage() {
  return (
    <>
      <TopBar title="" />
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <WeekView />
      </main>
    </>
  );
}
