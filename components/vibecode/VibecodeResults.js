"use client";

import Link from "next/link";
import { BadgeCheck, ExternalLink, Heart, Lock, Play, Users } from "lucide-react";
import { formatCount, tiktokProfileUrl } from "@/lib/discovery/directory";
import { CREATOR_NICHES } from "@/lib/onboarding/creatorConstants";

// Renders whatever /api/vibecode/scan returned. The route decides how much a
// caller may see, so this component's job is to make the locked state legible
// rather than to hide anything itself — everything it is given, it shows.
//
// The evidence leads. Real TikToks from the matched niche go first, because
// "would a video like that suit my app?" is the question a developer can
// actually answer in ten seconds, and the creators are the answer to "who
// makes them".
//
// Copy rule, same as the dashboard's DiscoveredCreatorCard: these creators
// have not signed up and have not agreed to work with anyone. Nothing here
// may imply they are available, interested, or vetted by us.
export default function VibecodeResults({ data, appUrl, onNicheChange, busy }) {
  const locked = Boolean(data.locked);
  const videos = data.videos || [];
  const videoCount = locked ? data.video_count : videos.length;
  const creators = data.creators || [];
  const creatorCount = locked ? data.creator_count : creators.length;

  const signupHref = `/signup?role=brand&from=scan${
    appUrl ? `&app=${encodeURIComponent(appUrl)}` : ""
  }`;

  return (
    <div className="mx-auto mt-12 max-w-5xl px-6 text-left">
      <AppCard
        app={data.app}
        niches={data.niches}
        onNicheChange={onNicheChange}
        busy={busy}
      />

      {/* Say plainly when we couldn't match on topic. Presenting general
          creators as if they were a niche match would be the one thing that
          makes this page untrustworthy. */}
      {data.coverage === "general" && creatorCount > 0 && (
        <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-amber-900">
          We don&apos;t have creators tagged{" "}
          <strong>{data.niches?.[0]}</strong> yet — we&apos;ve queued those
          searches. Below are creators who already make brand content and take
          this kind of work, whatever the niche. Try a neighbouring niche in
          the dropdown too.
        </p>
      )}

      {creatorCount === 0 ? (
        <p className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-amber-900">
          We&apos;re still expanding coverage here, so there isn&apos;t much to
          show yet — we&apos;ve queued the searches and it&apos;ll fill in. Try
          a different niche from the dropdown above in the meantime.
        </p>
      ) : (
        <>
          <section className="mt-10">
            <SectionHeading
              title="TikToks working in your niche"
              note={
                videoCount > 0
                  ? `${videoCount}${locked ? ` · ${Math.min(TEASER_HINT, videoCount)} shown` : ""}`
                  : null
              }
            />
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Real posts from the creators below. This is the format to brief —
              native and quick, not a polished ad.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {videos.map((v, i) => (
                <VideoTile key={i} video={v} locked={locked} />
              ))}
            </div>
          </section>

          <section className="mt-10">
            <SectionHeading
              title="Creators making them"
              note={
                creatorCount > 0
                  ? `${creatorCount} found${
                      locked ? ` · ${Math.min(creators.length, creatorCount)} shown` : ""
                    }`
                  : null
              }
            />
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {creators.map((c) => (
                <CreatorCard key={c.id} creator={c} locked={locked} />
              ))}
            </div>
          </section>
        </>
      )}

      {locked && creatorCount > 0 && (
        <UnlockBand creatorCount={creatorCount} href={signupHref} />
      )}
    </div>
  );
}

// Only used for the "n shown" hint; the route owns the real number.
const TEASER_HINT = 6;

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

function AppCard({ app, niches, onNicheChange, busy }) {
  const active = niches?.[0] || "";

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start">
      {app?.iconUrl ? (
        // Store artwork and OG images are arbitrary remote URLs, so they stay
        // outside next/image rather than being added to remotePatterns.
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
    </div>
  );
}

function VideoTile({ video, locked }) {
  const tile = (
    <div className="relative aspect-[9/13] overflow-hidden rounded-xl bg-brand-mist">
      {video.thumbnail_url ? (
        // TikTok CDN URLs are signed and expire, and every sync rewrites
        // them, so next/image would cache a dead signature.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={video.thumbnail_url}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-slate-300">
          <Play size={18} />
        </div>
      )}
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

function CreatorCard({ creator, locked }) {
  const videos = (creator.videos || []).slice(0, 3);

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {videos.length > 0 && (
        <div className="grid grid-cols-3 gap-px bg-slate-100">
          {videos.map((v, i) => (
            <div key={i} className="relative aspect-[9/13] overflow-hidden bg-brand-mist">
              {v.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.thumbnail_url} alt="" loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-300">
                  <Play size={14} />
                </div>
              )}
              {v.views > 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  {formatCount(v.views)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-4">
        {locked ? (
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
                <p className="truncate font-semibold text-brand-ink">
                  {creator.nickname || creator.username}
                </p>
                {creator.verified && (
                  <BadgeCheck size={15} className="shrink-0 text-brand-sky" aria-label="Verified on TikTok" />
                )}
              </div>
              <p className="truncate text-sm text-slate-500">@{creator.username}</p>
            </div>
          </div>
        )}

        <p className="text-[11px] font-medium text-slate-500">
          {creator.niche_matched ? (
            <span className="rounded-full bg-brand-mist px-2 py-0.5 text-brand-skyDeep">
              {creator.niche_tags?.[0] || "Niche match"}
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
              Open to brand work
            </span>
          )}
        </p>

        <dl className="mt-auto grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-brand-mist/60 px-3 py-2">
            <dt className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-slate-500">
              <Users size={11} /> Followers
            </dt>
            <dd className="font-semibold text-brand-ink">{formatCount(creator.follower_count)}</dd>
          </div>
          <div className="rounded-lg bg-brand-mist/60 px-3 py-2">
            <dt className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-slate-500">
              <Heart size={11} /> Avg likes
            </dt>
            {/* Lifetime likes / post count — a sampled average swings wildly
                on the ~1 video per creator a keyword search returns. */}
            <dd className="font-semibold text-brand-ink">{formatCount(creator.avg_likes_per_video)}</dd>
          </div>
        </dl>

        {!locked && (
          <a
            href={tiktokProfileUrl(creator.username)}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="flex items-center justify-center gap-1.5 rounded-full bg-brand-ink px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            View on TikTok <ExternalLink size={14} />
          </a>
        )}
      </div>
    </article>
  );
}

function UnlockBand({ creatorCount, href }) {
  return (
    <div className="mt-10 rounded-3xl bg-brand-ink px-6 py-8 text-center sm:px-10">
      <h3 className="font-display text-2xl font-bold text-white sm:text-3xl">
        {creatorCount > 0
          ? `See who made these — all ${creatorCount} creators`
          : "See who made these"}
      </h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
        Start the free trial to open every video, get the handles, and run the
        campaign — tracking each post and paying per video from one place.
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
