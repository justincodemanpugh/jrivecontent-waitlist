import TopBar from "@/components/dashboard/brand/TopBar";
import InboxList from "@/components/dashboard/messaging/InboxList";

export default function BrandMessagesPage() {
  return (
    <>
      <TopBar title="Messages" />
      <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-ink">
            Messages
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Each conversation starts after you accept a creator&apos;s
            application.
          </p>
        </div>
        <InboxList
          role="brand"
          basePath="/dashboard/brand/messages"
          emptyCopy="Accept a creator on one of your gigs to start a conversation."
        />
      </main>
    </>
  );
}
