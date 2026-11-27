import Image from "next/image";
import Link from "next/link";

export default function ViralNavbar() {
  return (
    <div className="sticky top-4 z-50 px-4">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full border border-slate-100 bg-white/90 px-4 py-3 shadow-lg shadow-slate-900/5 backdrop-blur sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="JriveContent home">
          <Image src="/images/jrive-logo.png" alt="" width={28} height={28} className="rounded-md" />
          {/* The wordmark gives way to the buttons on a narrow phone. */}
          <span className="hidden font-display text-xl font-semibold tracking-tight text-brand-ink min-[420px]:inline">
            Jrive<span className="text-slate-400">Content</span>
          </span>
        </Link>

        {/* Absolute links: this bar is also used away from the home page. */}
        <div className="hidden items-center gap-7 text-[15px] font-medium text-slate-700 md:flex">
          <Link href="/#features" className="transition hover:text-brand-ink">
            Features
          </Link>
          <Link href="/#pricing" className="transition hover:text-brand-ink">
            Pricing
          </Link>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/signin" className="text-[15px] font-medium text-brand-ink transition hover:text-brand-skyDeep">
            Log in
          </Link>
          <Link
            href="/start"
            className="rounded-full bg-brand-ink px-5 py-2.5 text-[15px] font-semibold text-white transition hover:bg-slate-800"
          >
            Get my plan
          </Link>
        </div>
      </nav>
    </div>
  );
}
