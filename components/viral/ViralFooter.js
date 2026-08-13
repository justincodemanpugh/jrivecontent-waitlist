import Image from "next/image";
import Link from "next/link";

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Pricing", href: "/#pricing" },
      { label: "FAQ", href: "/#faq" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    heading: "Company",
    links: [{ label: "Contact", href: "mailto:hello@jrivecontent.com" }],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export default function ViralFooter() {
  return (
    <footer className="bg-brand-ink">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/images/jrive-logo.png"
                alt="JriveContent"
                width={24}
                height={24}
                className="rounded-md"
              />
              <span className="font-display text-lg font-semibold text-white">
                Jrive<span className="text-slate-400">Content</span>
              </span>
            </Link>
            <p className="mt-3 max-w-[220px] text-sm text-slate-400">
              The operating system for UGC marketing.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <p className="text-sm font-semibold text-white">{col.heading}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-slate-400 transition hover:text-brand-sky"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-slate-500">
            © 2026 JriveContent. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
