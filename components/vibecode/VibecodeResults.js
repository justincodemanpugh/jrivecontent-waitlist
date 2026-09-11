"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight, BadgeCheck, ExternalLink, Heart, Lock, Play, RotateCcw, Users,
} from "lucide-react";
import { formatCount, tiktokProfileUrl } from "@/lib/discovery/directory";
import { CREATOR_NICHES } from "@/lib/onboarding/creatorConstants";

// Renders whatever /api/vibecode/scan returned. The route decides how much a
// caller may see, so this component's job is to make the locked state legible
// rather than to hide anything itself.
//
// The two creator tiers stay in separate sections rather than one ranked grid,
// matching the rule already stated in app/dashboard/brand/creators/page.js:
// members can be invited and paid, directory profiles cannot, and blending
// them "would imply the second group is hireable here".
export default function VibecodeResults({ data, appUrl, onNicheChange, onReset, busy }) {
  const locked = Boolean(data.locked);
  const platform = data.platform || [];
  const directory = data.directory || [];
  const platformCount = locked ? data.platform_count : platform.length;
  const directoryCount = locked ? data.directory_count : directory.length;
  const videos = data.videos || [];

  const signupHref = `/signup?role=brand&from=scan${
    appUrl ? `&app=${encodeURIComponent(appUrl)}` : ""
  }`;

  return (
    <div className="mx-auto max-w-5xl px-6 pb-20 text-left">
      <AppCard
        app={data.app}
        niches={data.niches}
        onNicheChange={onNicheChange}
        onReset={onReset}
        busy={busy}
      />

      {videos.length > 0 && (
        <section className="mt-10">
          <SectionHeading
            title={
              data.videos_are_niche
                ? "What's working in your niche"
                : "What's working in UGC right now"
            }
            note={data.video_count ? `${data.video_count} posts` : null}
          />
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            {data.videos_are_niche
              ? "Real TikToks pulling views in this space right now. This is the format to brief — native and quick, not a polished ad."
              : "We haven't scraped this niche yet, so these are the best-performing posts across the directory. The format is what to copy — native and quick, not a polished ad."}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {videos.map((v, i) => (
              <VideoTile key={i} video={v} locked={locked} />
            ))}
          </div>
        </section>
      )}

      {platformCount > 0 && (
        <section className="mt-12">
          <SectionHeading
            title="On JriveContent"
            note={`${platformCount} available`}
          />
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            These creators are on the platform. Invite them, send a brief, and
            pay per video — all from your dashboard.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {platform.map((c) => (
              <PlatformCard key={c.id} creator={c} locked={locked} />
            ))}
          </div>
        </section>
      )}

      {directoryCount > 0 && (
        <section className="mt-12">
          <SectionHeading
            title="Also on TikTok"
            note={`${directoryCount} found`}
          />
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            Public accounts we found in this niche. They haven&apos;t signed up,
            so you&apos;d reach out to them yourself.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {directory.map((c) => (
              <DirectoryCard key={c.id} creator={c} locked={locked} />
            ))}
          </div>
        </section>
      )}

      {platformCount === 0 && directoryCount === 0 && (
        <p className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-amber-900">
          We don&apos;t have creators in this niche yet — we&apos;ve queued the
          searches and it&apos;ll fill in. Try a neighbouring niche from the
          dropdown above in the meantime.
        </p>
      )}

      {locked
        ? (platformCount > 0 || directoryCount > 0) && (
            <UnlockBand platformCount={platformCount} href={signupHref} />
          )
        : platformCount > 0 && <NextStepBand />}
    </div>
  );
}

function SectionHeading({ title, note }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-slate-200 pb-3">
      <h3 className="font-display text-2xl font-bold text-brand-ink">{title}</h3>
      {note && (
        <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">
          {note}
        </span>
      )}
    </div>
  );
}

function AppCard({ app, niches, onNicheChange, onReset, busy }) {
  const active = niches?.[0] || "";

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start">
      {app?.iconUrl ? (
        // Store artwork is an arbitrary remote URL, so it stays outside
        // next/image rather than being added to remotePatterns.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={app.iconUrl}
          alt=""
          className="h-16 w-16 shrink-0 rounded-2xl bg-brand-mist object-cover"
        />
      ) : (
        <div className="h-16 w-16 shrink-0 rounded-2xl bg-brand-mist" />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl font-bold text-brand-ink">{app?.name}</h2>
          {app?.category && (
            <span className="rounded-full bg-brand-mist px-2.5 py-0.5 text-[11px] font-semibold text-brand-skyDeep">
              {app.category}
            </span>
          )}
        </div>

        {/* The niche is a guess from a lookup table, so it is presented as
            something to correct rather than as a verdict. */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label htmlFor="vibecode-niche" className="text-sm text-slate-500">
            Showing creators in
          </label>
          <select
            id="vibecode-niche"
            value={active}
            disabled={busy}
            onChange={(e) => onNicheChange?.(e.target.value)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-brand-ink shadow-sm focus:border-brand-skyDeep focus:outline-none focus:ring-2 focus:ring-brand-sky/30 disabled:opacity-60"
          >
            {CREATOR_NICHES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span className="text-sm text-slate-400">
            {busy ? "updating…" : "not right? change it"}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-brand-sky hover:text-brand-ink"
      >
        <RotateCcw size={14} /> Scan another
      </button>
    </div>
  );
}

// A signed TikTok CDN URL can expire between our refresh and the browser's
// request, so every tile needs a real fallback. A white box reads as broken;
// this reads as "no preview" and keeps the view count, which is the number
// people are actually scanning for.
function Thumb({ src, alt = "", className = "" }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-mist to-slate-200 ${className}`}
      >
        <Play size={18} className="text-slate-400" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}

function VideoTile({ video, locked }) {
  const tile = (
    <div className="relative aspect-[9/13] overflow-hidden rounded-xl bg-brand-mist">
      <Thumb
        src={video.thumbnail_url}
        className={locked ? "grayscale-[35%] transition group-hover:grayscale-0" : "transition duration-300 group-hover:scale-105"}
      />
      {video.views > 0 && (
        <span className="absolute bottom-1.5 left-1.5 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          {formatCount(video.views)}
        </span>
      )}
      {locked && (
        <span className="absolute right-1.5 top-1.5 rounded-full bg-black/55 p-1 text-white">
          <Lock size={11} />
        </span>
      )}
    </div>
  );

  // Locked tiles are inert on purpose: you can see what is working and how
  // well, you start a trial to find out who made it.
  if (locked) return <div className="group">{tile}</div>;

  return (
    <a
      href={video.video_url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="group block"
    >
      {tile}
    </a>
  );
}

function LockedIdentity() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100" />
      <div
        className="min-w-0 flex-1 space-y-1.5"
        aria-label="Creator hidden until you start a trial"
      >
        <div className="h-3 w-24 rounded-full bg-slate-200" />
        <div className="h-2.5 w-16 rounded-full bg-slate-100" />
      </div>
      <Lock size={15} className="shrink-0 text-slate-400" />
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg bg-brand-mist/60 px-3 py-2">
      <dt className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-slate-500">
        <Icon size={11} /> {label}
      </dt>
      <dd className="font-semibold text-brand-ink">{value}</dd>
    </div>
  );
}

// A creator who signed up. This is what the subscription actually buys, so the
// card leads with the action the product can genuinely perform.
function PlatformCard({ creator, locked }) {
  const rate =
    creator.rate_min && creator.rate_max
      ? `$${creator.rate_min}–${creator.rate_max}`
      : creator.rate_min
        ? `From $${creator.rate_min}`
        : "Ask";

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-brand-sky/40 bg-white p-4 shadow-sm ring-1 ring-brand-sky/10">
      <span className="w-fit rounded-full bg-brand-mist px-2 py-0.5 text-[11px] font-semibold text-brand-skyDeep">
        On JriveContent
      </span>

      {locked ? (
        <LockedIdentity />
      ) : (
        <div className="flex items-start gap-3">
          {creator.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={creator.avatar_url}
              alt=""
              loading="lazy"
              className="h-10 w-10 shrink-0 rounded-full bg-brand-mist object-cover"
            />
          ) : (
            <div className="h-10 w-10 shrink-0 rounded-full bg-brand-mist" />
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold text-brand-ink">{creator.name}</p>
            {creator.location && (
              <p className="truncate text-sm text-slate-500">{creator.location}</p>
            )}
          </div>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-2 text-sm">
        <Stat icon={Users} label="Per video" value={rate} />
        <Stat
          icon={Play}
          label="Makes"
          value={creator.content_types?.[0] || "UGC video"}
        />
      </dl>

      {creator.niches?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {creator.niches.slice(0, 2).map((n) => (
            <span
              key={n}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
            >
              {n}
            </span>
          ))}
        </div>
      )}

      {!locked && (
        <Link
          href={`/dashboard/brand/creators?invite=${encodeURIComponent(creator.id)}`}
          className="mt-auto flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-brand-skyDeep to-brand-sky px-3 py-2 text-sm font-semibold text-white transition hover:brightness-105"
        >
          Invite <ArrowRight size={14} />
        </Link>
      )}
    </article>
  );
}

// A scraped public account. Copy rule, same as the dashboard's
// DiscoveredCreatorCard: these people have not signed up and have not agreed
// to work with anyone. Nothing here may imply availability, interest, or that
// we vetted them, and the verified badge is TikTok's, not ours.
function DirectoryCard({ creator, locked }) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="w-fit rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
        Found on TikTok
      </span>

      {locked ? (
        <LockedIdentity />
      ) : (
        <div className="flex items-start gap-3">
          {creator.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={creator.avatar_url}
              alt=""
              loading="lazy"
              className="h-10 w-10 shrink-0 rounded-full bg-brand-mist object-cover"
            />
          ) : (
            <div className="h-10 w-10 shrink-0 rounded-full bg-brand-mist" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="truncate font-semibold text-brand-ink">{creator.name}</p>
              {creator.verified && (
                <BadgeCheck size={15} className="shrink-0 text-brand-sky" aria-label="Verified on TikTok" />
              )}
            </div>
            <p className="truncate text-sm text-slate-500">@{creator.username}</p>
          </div>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-2 text-sm">
        <Stat icon={Users} label="Followers" value={formatCount(creator.follower_count)} />
        {/* Lifetime likes / post count — a sampled average swings wildly on
            the ~1 video per creator a keyword search returns. */}
        <Stat icon={Heart} label="Avg likes" value={formatCount(creator.avg_likes_per_video)} />
      </dl>

      {!locked && (
        <a
          href={tiktokProfileUrl(creator.username)}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-auto flex items-center justify-center gap-1.5 rounded-full bg-brand-ink px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          View on TikTok <ExternalLink size={14} />
        </a>
      )}
    </article>
  );
}

function UnlockBand({ platformCount, href }) {
  return (
    <div className="mt-12 rounded-3xl bg-brand-ink px-6 py-8 text-center sm:px-10">
      <h3 className="font-display text-2xl font-bold text-white sm:text-3xl">
        {platformCount > 0
          ? `Unlock ${platformCount} creators you can hire today`
          : "Unlock these creators"}
      </h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
        Start the free trial to see who they are, invite them to your campaign,
        and pay per video — tracking every post from one dashboard.
      </p>
      <Link
        href={href}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-skyDeep to-brand-sky px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-sky/20 transition hover:brightness-110"
      >
        Start free trial
      </Link>
      <p className="mt-3 text-xs text-slate-400">$0 today · cancel anytime</p>
    </div>
  );
}

// The answer to "the creators loaded — now what?". Without this the unlocked
// view is a dead end.
function NextStepBand() {
  return (
    <div className="mt-12 rounded-3xl border border-brand-sky/30 bg-brand-mist/50 px-6 py-8 text-center sm:px-10">
      <h3 className="font-display text-2xl font-bold text-brand-ink">
        Ready to brief them?
      </h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
        Create a campaign, set your per-video rate, and invite the creators you
        picked. Every post they make gets tracked against it.
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/dashboard/brand/gigs/new"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-skyDeep to-brand-sky px-7 py-3 text-base font-semibold text-white shadow-lg shadow-brand-sky/20 transition hover:brightness-110"
        >
          Create a campaign <ArrowRight size={17} />
        </Link>
        <Link
          href="/dashboard/brand/creators"
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-7 py-3 text-base font-semibold text-brand-ink transition hover:border-brand-sky"
        >
          Open my dashboard
        </Link>
      </div>
    </div>
  );
}
