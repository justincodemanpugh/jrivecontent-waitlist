import TopBar from "@/components/dashboard/brand/TopBar";
import ApplicantsView from "@/components/dashboard/brand/applicants/ApplicantsView";

export default function BrandApplicantsPage() {
  return (
    <>
      <TopBar title="Applicants" />
      <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-ink">
            Applicants
          </h1>
          <p className="mt-1 text-sm text-muted">
            Every creator who&apos;s applied to one of your gigs. Accept to
            open a conversation, decline to remove from your roster.
          </p>
        </div>
        <ApplicantsView />
      </main>
    </>
  );
}
