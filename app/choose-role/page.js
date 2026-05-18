"use client";

import Link from "next/link";
import { Building2, Sparkles } from "lucide-react";

export default function ChooseRolePage() {
  return (
    <div className="min-h-screen bg-brand-mist/40 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-brand-ink">
            Welcome to JriveContent
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            How would you like to use the platform?
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/onboarding/brand"
            className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 text-left transition hover:border-brand-skyDeep hover:bg-brand-mist/50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-mist">
              <Building2 className="h-6 w-6 text-brand-skyDeep" />
            </div>
            <div>
              <div className="font-semibold text-brand-ink">I'm a Brand</div>
              <div className="text-sm text-slate-600">
                Find creators to promote my products
              </div>
            </div>
          </Link>

          <Link
            href="/onboarding/creator"
            className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 text-left transition hover:border-brand-skyDeep hover:bg-brand-mist/50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-mist">
              <Sparkles className="h-6 w-6 text-brand-skyDeep" />
            </div>
            <div>
              <div className="font-semibold text-brand-ink">I'm a Creator</div>
              <div className="text-sm text-slate-600">
                Partner with brands and get paid
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
