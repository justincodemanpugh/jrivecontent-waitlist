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
          <a href="#pricing" className="hover:text-brand-ink transition">Pricing</a>
          <a href="#faq" className="hover:text-brand-ink transition">FAQ</a>
        </div>

        <div className="hidden md:flex items-center gap-3 justify-self-end">
          <Link
            href="/signin"
            className="text-sm font-medium text-slate-600 hover:text-brand-ink transition"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center rounded-full bg-brand-skyDeep text-white px-5 py-2 text-sm font-medium hover:bg-brand-ink transition"
          >
            Get started
          </Link>
        </div>

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
            <a href="#pricing" onClick={() => setOpen(false)}>Pricing</a>
            <a href="#faq" onClick={() => setOpen(false)}>FAQ</a>
            <Link
              href="/signin"
              onClick={() => setOpen(false)}
              className="text-slate-600"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="inline-flex justify-center rounded-full bg-brand-skyDeep text-white px-5 py-2 font-medium"
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
