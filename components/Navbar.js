"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-100">
      <nav className="relative mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-sky">
            <img src="/logo.svg" alt="Jrive" className="h-5 w-5 text-white" style={{ filter: "brightness(0) invert(1)" }} />
          </span>
          <span className="font-semibold tracking-tight text-lg">
            Jrive<span className="text-brand-skyDeep">Content</span>
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8 text-sm text-slate-600 absolute left-1/2 -translate-x-1/2">
          <a href="#how-it-works" className="hover:text-brand-ink transition">How it Works</a>
        </div>

        <a
          href="https://app.youform.com/forms/aj4rmaai"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex items-center rounded-full bg-brand-ink text-white px-5 py-2 text-sm font-medium hover:bg-slate-800 transition"
        >
          Sign Up
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
        <div className="md:hidden border-t border-slate-100 bg-white">
          <div className="px-6 py-4 flex flex-col gap-4 text-sm">
            <a href="#how-it-works" onClick={() => setOpen(false)}>How it Works</a>
            <a
              href="https://app.youform.com/forms/aj4rmaai"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="inline-flex justify-center rounded-full bg-brand-ink text-white px-5 py-2 font-medium"
            >
              Sign Up
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
