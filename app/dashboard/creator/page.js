"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Music2,
  Film,
  Eye,
  DollarSign,
  ImagePlus,
} from "lucide-react";
import TopBar from "@/components/dashboard/creator/TopBar";
import StatStrip from "@/components/dashboard/creator/home/StatStrip";
import { useCreator } from "@/components/dashboard/creator/CreatorProvider";
import {
  fetchMyTikTokAccount,
  fetchMyTikTokHandle,
  fetchMyProgramMemberships,
} from "@/lib/dashboard/creator/programsApi";

function formatMoney(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

function formatCompact(n) {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(n || 0);
}

export default function CreatorHomePage() {
  const creator = useCreator();
  const [connected, setConnected] = useState(false);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [account, handle, rows] = await Promise.all([
        fetchMyTikTokAccount(),
        fetchMyTikTokHandle(),
        fetchMyProgramMemberships(),
      ]);
      setConnected(Boolean(account || handle));
      setMemberships(rows);
    } catch {
      // silent — empty state shows instead
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const refresh = () => load();
    window.addEventListener("creator-programs:changed", refresh);
    return () => window.removeEventListener("creator-programs:changed", refresh);
  }, [load]);

  const invited = useMemo(
    () => memberships.filter((m) => m.status === "invited"),
    [memberships],
  );
  const active = useMemo(
    () => memberships.filter((m) => m.status === "active"),
    [memberships],
  );

  const totals = useMemo(
    () =>
      active.reduce(
        (acc, m) => {
          acc.videos += m.videoCount || 0;
          acc.views += m.totals?.views || 0;
          acc.pending += (m.payouts || [])
            .filter((p) => p.status === "pending" || p.status === "escrowed")
            .reduce((sum, p) => sum + (p.creatorPayoutCents || 0), 0);
          return acc;
        },
        { videos: 0, views: 0, pending: 0 },
      ),
    [active],
  );

  const missingBio = !creator.bio;
  const missingHandle = !creator.handle;
  const profileComplete = !missingBio && !missingHandle;
  const profilePct = [!!creator.bio, !!creator.handle, creator.niches.length > 0].filter(
    Boolean,
  ).length;
  const profilePctDisplay = Math.round((profilePct / 3) * 100);

  return (
    <>
      <TopBar title="Home" />
      <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink">
            Hey, {creator.firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted">
            {connected
              ? "Your TikTok videos are being tracked automatically."
              : "Connect TikTok so brands can track your videos and pay you."}
          </p>
        </div>

        <StatStrip />

        {/* Connect TikTok — the one thing a creator has to do */}
        {!loading && !connected && (
          <div className="rounded-2xl border border-line bg-surface p-8 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-ink text-on-accent mb-3">
              <Music2 size={22} />
            </span>
            <h2 className="text-lg font-semibold text-ink">Connect your TikTok</h2>
            <p className="mt-1 text-sm text-muted max-w-sm mx-auto">
              That&apos;s all you need to do. Once connected, brands track your posted
              videos automatically and pay you for them — no uploads, no applications.
            </p>
            <Link
              href="/dashboard/creator/programs"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink text-on-accent px-5 py-2.5 text-sm font-semibold hover:bg-ink/90 transition"
            >
              <Music2 size={15} />
              Connect TikTok
            </Link>
          </div>
        )}

        {!profileComplete && (
          <div className="rounded-2xl border border-warn-line bg-warn-soft px-5 py-4 flex items-center gap-4">
            <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-surface flex items-center justify-center text-warn">
              <ImagePlus size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-warn">
                Your profile is {profilePctDisplay}% complete
              </p>
              <p className="text-xs text-warn mt-0.5">
                {missingBio && !missingHandle
                  ? "Add a short bio so brands know what you're about."
                  : !missingBio && missingHandle
                  ? "Add a creator handle so brands can find your socials."
                  : "Add a bio and handle to attract more brands."}
              </p>
            </div>
            <Link
              href="/dashboard/creator/profile/edit"
              className="flex-shrink-0 text-xs font-semibold text-warn hover:underline underline-offset-2 flex items-center gap-1"
            >
              Complete profile
              <ArrowRight size={12} />
            </Link>
          </div>
        )}

        {/* Pending program invites */}
        {invited.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              Program invitations
              <span className="text-xs font-medium text-faint">({invited.length})</span>
            </h2>
            <div className="space-y-2">
              {invited.map((m) => (
                <ProgramRow key={m.id} membership={m} pending />
              ))}
            </div>
          </section>
        )}

        {/* Active programs */}
        {active.length > 0 && (
          <>
            <section>
              <h2 className="text-sm font-semibold text-ink mb-3">
                Your programs
                <span className="ml-2 text-xs font-medium text-faint">
                  ({active.length})
                </span>
              </h2>
              <div className="space-y-2">
                {active.map((m) => (
                  <ProgramRow key={m.id} membership={m} />
                ))}
              </div>
            </section>

            <div className="grid grid-cols-3 gap-3">
              <StatCard
                label="Videos tracked"
                value={totals.videos}
                icon={<Film size={16} />}
                tint="text-accent bg-accent-tint"
              />
              <StatCard
                label="Total views"
                value={formatCompact(totals.views)}
                icon={<Eye size={16} />}
                tint="text-warn bg-warn-soft"
              />
              <StatCard
                label="Upcoming pay"
                value={formatMoney(totals.pending)}
                icon={<DollarSign size={16} />}
                tint="text-success bg-success-soft"
              />
            </div>

            <div className="text-center">
              <Link
                href="/dashboard/creator/programs"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline underline-offset-2"
              >
                View all programs
                <ArrowRight size={14} />
              </Link>
            </div>
          </>
        )}

        {/* Connected but no programs yet */}
        {!loading && connected && memberships.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-surface p-12 text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-accent-tint flex items-center justify-center mb-4">
              <Film size={22} className="text-accent" />
            </div>
            <p className="text-base font-semibold text-ink">You&apos;re all set</p>
            <p className="text-sm text-muted mt-1 max-w-xs mx-auto">
              Your TikTok is connected. Brands will invite you to programs here — keep
              posting and your videos will be tracked automatically.
            </p>
          </div>
        )}
      </main>
    </>
  );
}

function ProgramRow({ membership, pending }) {
  return (
    <Link
      href="/dashboard/creator/programs"
      className="flex items-center gap-4 rounded-2xl border border-line bg-surface px-5 py-4 hover:border-accent-soft/60 hover:shadow-sm transition"
    >
      <div
        className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          pending ? "bg-warn-soft text-warn" : "bg-accent-tint text-accent"
        }`}
      >
        {pending ? <ImagePlus size={18} /> : <Film size={18} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink truncate">{membership.title}</p>
        <p className="text-xs text-muted mt-0.5">
          {pending
            ? `${membership.brandName} invited you · ${membership.videosPerPeriod} videos/${membership.periodType}`
            : `${membership.brandName} · ${membership.videoCount} videos tracked`}
        </p>
      </div>
      <span className="text-sm font-semibold text-success flex-shrink-0">
        {formatMoney(membership.payPerVideoCents)}
      </span>
      <ArrowRight size={16} className="text-faint flex-shrink-0" />
    </Link>
  );
}

function StatCard({ label, value, icon, tint }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${tint} mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-semibold text-ink tabular-nums">{value}</p>
      <p className="text-xs text-muted mt-0.5">{label}</p>
    </div>
  );
}
