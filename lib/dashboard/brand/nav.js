// The brand dashboard has four sections. Each older screen lives under one of
// them as a sub-tab (shown by TopBar), so nothing needs its own nav entry.

export const SECTIONS = [
  {
    id: "week",
    label: "This week",
    href: "/dashboard/brand",
    pages: [{ label: "This week", href: "/dashboard/brand" }],
  },
  {
    id: "creators",
    label: "Creators",
    href: "/dashboard/brand/board",
    pages: [
      { label: "Board", href: "/dashboard/brand/board" },
      { label: "Find creators", href: "/dashboard/brand/creators" },
      { label: "My creators", href: "/dashboard/brand/my-creators" },
      { label: "Messages", href: "/dashboard/brand/messages" },
    ],
  },
  {
    id: "results",
    label: "Results",
    href: "/dashboard/brand/programs",
    pages: [
      { label: "Overview", href: "/dashboard/brand/programs" },
      { label: "Videos", href: "/dashboard/brand/programs/videos" },
      { label: "Campaigns", href: "/dashboard/brand/programs/manage" },
      { label: "Accounts", href: "/dashboard/brand/programs/accounts" },
    ],
  },
  {
    id: "payouts",
    label: "Payouts",
    href: "/dashboard/brand/programs/payouts",
    pages: [{ label: "Payouts", href: "/dashboard/brand/programs/payouts" }],
  },
];

const under = (pathname, href) =>
  pathname === href || (href !== "/dashboard/brand" && pathname.startsWith(`${href}/`));

// The section and sub-tab a path belongs to: the most specific page wins, so
// /programs/payouts is Payouts and a campaign's own page (/programs/<id>) is
// Results. Pages outside the four (settings) belong to none.
export function locate(pathname) {
  let found = { section: null, page: null };
  for (const section of SECTIONS) {
    for (const page of section.pages) {
      if (under(pathname, page.href) && page.href.length > (found.page?.href.length || 0)) {
        found = { section, page };
      }
    }
  }
  return found;
}
