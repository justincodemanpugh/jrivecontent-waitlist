// Mock data for the brand dashboard.
// Replace with real API calls once backend is ready.

export const mockBrand = {
  name: "Acme Skincare",
  initials: "AS",
  freeGigsRemaining: 2,
  freeGigsTotal: 3,
};

export const mockStats = {
  activeGigs: 3,
  newApplications: 12,
  awaitingApproval: 2,
  completedThisMonth: 4,
};

export const mockAttentionItems = [
  {
    id: "a1",
    type: "applicants",
    title: '5 new applicants on "Skincare unboxing"',
    subtitle: "Posted 2 days ago · $80 budget",
    cta: "Review",
    href: "/dashboard/brand/gigs/1",
  },
  {
    id: "a2",
    type: "delivery",
    title: 'Video delivered for "Morning coffee ad"',
    subtitle: "By @sarah_creates · awaiting your approval",
    cta: "Approve",
    href: "/dashboard/brand/gigs/2",
  },
  {
    id: "a3",
    type: "message",
    title: "New message from @maria.films",
    subtitle: '"Hey! Quick question about the product..."',
    cta: "Reply",
    href: "/dashboard/brand/messages",
  },
];

export const mockGigs = [
  {
    id: 1,
    title: "Skincare unboxing video",
    cover: "from-rose-200 to-amber-100",
    budget: 80,
    deadline: "Due in 5 days",
    applicants: 5,
    status: "reviewing", // open | reviewing | in_production | awaiting_approval | completed
    isActive: true,
  },
  {
    id: 2,
    title: "Morning coffee ad",
    cover: "from-amber-200 to-orange-100",
    budget: 120,
    deadline: "Due in 2 days",
    applicants: 3,
    status: "awaiting_approval",
    isActive: true,
  },
  {
    id: 3,
    title: "Product testimonial",
    cover: "from-sky-200 to-indigo-100",
    budget: 60,
    deadline: "Due in 9 days",
    applicants: 0,
    status: "open",
    isActive: true,
  },
  {
    id: 4,
    title: "Summer sunscreen launch",
    cover: "from-yellow-200 to-rose-100",
    budget: 100,
    deadline: "Closed",
    applicants: 8,
    status: "completed",
    isActive: false,
  },
  {
    id: 5,
    title: "Lip balm try-on",
    cover: "from-pink-200 to-fuchsia-100",
    budget: 45,
    deadline: "Closed",
    applicants: 2,
    status: "completed",
    isActive: false,
  },
];

export const STATUS_META = {
  open: { label: "Open", classes: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  reviewing: { label: "Reviewing", classes: "bg-sky-50 text-sky-700 border-sky-200" },
  in_production: { label: "In production", classes: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  awaiting_approval: { label: "Needs approval", classes: "bg-amber-50 text-amber-700 border-amber-200" },
  completed: { label: "Completed", classes: "bg-slate-100 text-slate-600 border-slate-200" },
};
