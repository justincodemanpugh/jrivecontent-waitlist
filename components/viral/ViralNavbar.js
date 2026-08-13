import Image from "next/image";
import Link from "next/link";

export default function ViralNavbar() {
  return (
    <div className="sticky top-4 z-50 px-4">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-full border border-slate-100 bg-white/90 px-4 py-3 shadow-lg shadow-slate-900/5 backdrop-blur sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/images/jrive-logo.png"
            alt="JriveContent"
            width={28}
            height={28}
            className="rounded-md"
          />
          <span className="text-xl font-semibold tracking-tight text-brand-ink font-display">
            Jrive<span className="text-slate-400">Content</span>
          </span>
        </Link>

        {/* Center nav */}
        <div className="hidden items-center gap-7 text-[15px] font-medium text-slate-700 lg:flex">
          <a href="#how-it-works" className="transition hover:text-brand-ink">
            How it works
          </a>
          <a href="#pricing" className="transition hover:text-brand-ink">
            Pricing
          </a>
          <Link href="/blog" className="transition hover:text-brand-ink">
            Blog
          </Link>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/signin"
            className="hidden text-[15px] font-medium text-brand-ink transition hover:text-brand-skyDeep sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-gradient-to-r from-brand-skyDeep to-brand-sky px-5 py-2.5 text-[15px] font-semibold text-white shadow-md shadow-brand-sky/30 transition hover:brightness-105"
          >
            Get Started
          </Link>
        </div>
      </nav>
    </div>
  );
}
