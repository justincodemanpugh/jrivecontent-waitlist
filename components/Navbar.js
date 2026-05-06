"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-4 left-0 right-0 z-50 px-4">
      <nav className="relative mx-auto max-w-5xl bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-lg shadow-slate-900/5 rounded-full pl-5 pr-2 h-14 flex md:grid md:grid-cols-3 items-center justify-between">
        <a href="#" className="flex items-center gap-2 md:justify-self-start">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-sky">
            <img src="/logo.svg" alt="Jrive" className="h-4 w-4" style={{ filter: "brightness(0) invert(1)" }} />
          </span>
          <span className="font-semibold tracking-tight text-base">
            Jrive<span className="text-brand-skyDeep">Content</span>
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8 text-sm text-slate-600 justify-self-center">
          <a href="#how-it-works" className="hover:text-brand-ink transition">How it Works</a>
          <Link href="/dashboard/brand" prefetch className="hover:text-brand-ink transition">Brands</Link>
          <Link href="/dashboard/creator" prefetch className="hover:text-brand-ink transition">Creators</Link>
        </div>

        <a
          href="https://app.youform.com/forms/aj4rmaai"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex items-center rounded-full bg-brand-skyDeep text-white px-5 py-2 text-sm font-medium hover:bg-brand-ink transition justify-self-end"
        >
          Join Waitlist
        </a>

        <button
          className="md:hidden p-2"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden mx-auto max-w-5xl mt-2 rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-md shadow-lg shadow-slate-900/5">
          <div className="px-6 py-4 flex flex-col gap-4 text-sm">
            <a href="#how-it-works" onClick={() => setOpen(false)}>How it Works</a>
            <Link href="/dashboard/brand" prefetch onClick={() => setOpen(false)}>Brands</Link>
            <Link href="/dashboard/creator" prefetch onClick={() => setOpen(false)}>Creators</Link>
            <a
              href="https://app.youform.com/forms/aj4rmaai"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="inline-flex justify-center rounded-full bg-brand-skyDeep text-white px-5 py-2 font-medium"
            >
              Join Waitlist
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
