import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-brand-sky">
            <img src="/logo.svg" alt="" className="h-4 w-4" style={{ filter: "brightness(0) invert(1)" }} />
          </span>
          <span className="font-semibold text-sm">
            Jrive<span className="text-brand-skyDeep">Content</span>
          </span>
        </div>
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} JriveContent. All rights reserved.
        </p>
        <div className="flex gap-5 text-xs text-slate-500">
          <Link href="/blog" className="hover:text-brand-ink">Blog</Link>
          <Link href="/terms" className="hover:text-brand-ink">Terms</Link>
          <Link href="/privacy" className="hover:text-brand-ink">Privacy</Link>
          <a href="mailto:hello@jrivecontent.com" className="hover:text-brand-ink">Contact</a>
        </div>
      </div>
    </footer>
  );
}
