"use client";

import TopBar from "@/components/dashboard/brand/TopBar";
import ProgramsNav from "@/components/dashboard/brand/programs/ProgramsNav";

// Shared layout for every Programs sub-page: the brand TopBar, the grouped
// secondary nav on the left, and the page content on the right. Optionally
// renders a page heading + subtitle + an action slot (e.g. a Create button).
export default function ProgramsShell({
  title = "Programs",
  heading,
  subtitle,
  action,
  children,
}) {
  return (
    <>
      <TopBar title={title} />
      <div className="flex">
        <ProgramsNav />
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {(heading || action) && (
              <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                  {heading && (
                    <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-brand-ink">
                      {heading}
                    </h1>
                  )}
                  {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
                </div>
                {action}
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
