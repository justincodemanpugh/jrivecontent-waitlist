"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useCreator } from "@/components/dashboard/creator/CreatorProvider";
import NotificationsBell from "@/components/dashboard/NotificationsBell";
import ThemeToggle from "@/components/dashboard/ThemeToggle";

export default function TopBar({ title = "Home" }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const creator = useCreator();

  return (
    <header className="sticky top-0 z-30 h-16 bg-surface/80 backdrop-blur-md border-b border-line">
      <div className="h-full px-6 flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold text-ink">{title}</h1>

        <div className="flex items-center gap-2">
          <NotificationsBell />

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-surface-hover transition"
            >
              <span className="h-8 w-8 rounded-full overflow-hidden bg-accent-soft text-on-accent text-sm font-semibold flex items-center justify-center">
                {creator.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={creator.avatarUrl}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  creator.initials
                )}
              </span>
              <ChevronDown size={14} className="text-muted" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-line bg-surface shadow-lg shadow-scrim/5 py-1.5 z-20">
                  <div className="px-3 py-2 border-b border-line">
                    <p className="text-sm font-semibold text-ink">
                      {creator.name}
                    </p>
                    <p className="text-xs text-muted">Creator account</p>
                  </div>
                  <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-line">
                    <span className="text-sm text-ink-soft">Theme</span>
                    <ThemeToggle compact />
                  </div>
                  <Link
                    href="/dashboard/creator/profile"
                    className="block px-3 py-2 text-sm text-ink-soft hover:bg-surface-sunken"
                    onClick={() => setMenuOpen(false)}
                  >
                    My profile
                  </Link>
                  <Link
                    href="/dashboard/creator/settings"
                    className="block px-3 py-2 text-sm text-ink-soft hover:bg-surface-sunken"
                    onClick={() => setMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <form action="/auth/signout" method="post">
                    <button
                      type="submit"
                      className="block w-full text-left px-3 py-2 text-sm text-ink-soft hover:bg-surface-sunken"
                    >
                      Log out
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
