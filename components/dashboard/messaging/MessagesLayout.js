"use client";

import { usePathname } from "next/navigation";
import InboxList from "./InboxList";

/**
 * Two-column messages layout:
 * - Left: conversation list (InboxList)
 * - Right: selected conversation thread ({children}) or empty state
 *
 * Mobile (< md): shows only one column at a time. When at the base path the
 * inbox is full-width; when a conversation is selected the thread takes over.
 */
export default function MessagesLayout({
  role,
  basePath,
  emptyCopy,
  intro,
  children,
}) {
  const pathname = usePathname();
  // A conversation is open whenever the URL is deeper than the base path,
  // e.g. /dashboard/brand/messages/<id>.
  const hasSelection =
    pathname && pathname !== basePath && pathname.startsWith(`${basePath}/`);

  return (
    <div className="flex h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)] bg-surface">
      {/* Inbox column */}
      <aside
        className={[
          "w-full md:w-80 lg:w-96 md:shrink-0 border-r border-line flex flex-col",
          hasSelection ? "hidden md:flex" : "flex",
        ].join(" ")}
      >
        <div className="px-4 py-4 border-b border-line">
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            Messages
          </h1>
          {intro ? (
            <p className="mt-1 text-xs text-muted">{intro}</p>
          ) : null}
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <InboxList
            role={role}
            basePath={basePath}
            emptyCopy={emptyCopy}
          />
        </div>
      </aside>

      {/* Thread column */}
      <section
        className={[
          "flex-1 min-w-0",
          hasSelection ? "flex" : "hidden md:flex",
          "flex-col",
        ].join(" ")}
      >
        {children}
      </section>
    </div>
  );
}
