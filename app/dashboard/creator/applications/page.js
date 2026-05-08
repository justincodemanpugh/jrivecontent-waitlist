import TopBar from "@/components/dashboard/creator/TopBar";
import ApplicationsView from "@/components/dashboard/creator/applications/ApplicationsView";
import InvitationsList from "@/components/dashboard/creator/applications/InvitationsList";

export default function CreatorApplicationsPage() {
  return (
    <>
      <TopBar title="My Applications" />
      <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-ink">
            My applications
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Track every gig you&apos;ve applied to, plus any direct invitations
            from brands.
          </p>
        </div>
        <InvitationsList />
        <ApplicationsView />
      </main>
    </>
  );
}
