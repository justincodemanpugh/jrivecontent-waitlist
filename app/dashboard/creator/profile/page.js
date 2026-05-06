"use client";

import Link from "next/link";
import { Pencil, Instagram, Youtube, Globe } from "lucide-react";
import TopBar from "@/components/dashboard/creator/TopBar";
import { useCreator } from "@/components/dashboard/creator/CreatorProvider";

export default function CreatorProfilePage() {
  const creator = useCreator();

  return (
    <>
      <TopBar title="Profile" />
      <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto space-y-6">
        {/* Header card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-start gap-4">
            <span className="h-16 w-16 shrink-0 rounded-full bg-brand-sky text-white text-xl font-semibold flex items-center justify-center">
              {creator.initials}
            </span>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-brand-ink">
                {creator.name}
              </h2>
              {creator.handle ? (
                <p className="text-sm text-slate-500">@{creator.handle}</p>
              ) : null}
              <p className="mt-2 text-sm text-slate-600">
                {creator.bio || "Add a short bio so brands know who you are."}
              </p>
            </div>
            <Link
              href="/dashboard/creator/profile/edit"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <Pencil size={14} />
              Edit
            </Link>
          </div>

          {creator.niches.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {creator.niches.map((n) => (
                <span
                  key={n}
                  className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-brand-mist text-brand-skyDeep"
                >
                  {n}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Socials */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-brand-ink mb-3">
            Where to find me
          </h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <Instagram size={16} className="text-slate-400" />
              <span className="text-slate-400">Instagram not linked</span>
            </li>
            <li className="flex items-center gap-2">
              <Youtube size={16} className="text-slate-400" />
              <span className="text-slate-400">YouTube not linked</span>
            </li>
            <li className="flex items-center gap-2">
              <Globe size={16} className="text-slate-400" />
              <span className="text-slate-400">Portfolio not linked</span>
            </li>
          </ul>
        </div>

        {/* Portfolio placeholder */}
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <h3 className="text-base font-semibold text-brand-ink">
            Showcase your work
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            Upload sample videos or photos so brands can preview your style
            before reaching out. Coming soon.
          </p>
        </div>
      </main>
    </>
  );
}
