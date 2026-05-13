import { MessageSquare } from "lucide-react";

export default function EmptyThreadState() {
  return (
    <div className="flex-1 hidden md:flex items-center justify-center bg-brand-mist/30">
      <div className="text-center px-6">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-slate-200 text-brand-skyDeep mb-3 shadow-sm">
          <MessageSquare size={22} />
        </span>
        <p className="text-sm font-semibold text-brand-ink">
          Select a conversation
        </p>
        <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
          Choose a conversation from the list to start messaging.
        </p>
      </div>
    </div>
  );
}
