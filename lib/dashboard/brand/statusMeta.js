// Shared status label + tailwind classes for brand-side gig cards.
// Kept separate from any data-fetching so multiple components can import
// the same look without pulling in unrelated modules.

export const STATUS_META = {
  open: {
    label: "Open",
    classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  reviewing: {
    label: "Reviewing",
    classes: "bg-sky-50 text-sky-700 border-sky-200",
  },
  in_production: {
    label: "In production",
    classes: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  awaiting_approval: {
    label: "Needs approval",
    classes: "bg-amber-50 text-amber-700 border-amber-200",
  },
  completed: {
    label: "Completed",
    classes: "bg-slate-100 text-slate-600 border-slate-200",
  },
};
