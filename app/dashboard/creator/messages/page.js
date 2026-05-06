import { MessageSquare } from "lucide-react";
import TopBar from "@/components/dashboard/creator/TopBar";

export default function CreatorMessagesPage() {
  return (
    <>
      <TopBar title="Messages" />
      <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-mist text-brand-skyDeep mb-3">
            <MessageSquare size={20} />
          </span>
          <h2 className="text-lg font-semibold text-brand-ink">
            No messages yet
          </h2>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            Once you apply to a gig and a brand replies, your conversations
            will show up here.
          </p>
        </div>
      </main>
    </>
  );
}
