import TopBar from "@/components/dashboard/creator/TopBar";
import InboxList from "@/components/dashboard/messaging/InboxList";

export default function CreatorMessagesPage() {
  return (
    <>
      <TopBar title="Messages" />
      <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-ink">
            Messages
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Conversations open up here once a brand accepts your application.
          </p>
        </div>
        <InboxList
          role="creator"
          basePath="/dashboard/creator/messages"
          emptyCopy="Once a brand accepts your application, your conversation will show up here."
        />
      </main>
    </>
  );
}
