"use client";

import Link from "next/link";
import {
  BadgeCheck, ExternalLink, Heart, Lock, Play, Sparkles, Users,
} from "lucide-react";
import { formatCount, tiktokProfileUrl } from "@/lib/discovery/directory";

// Renders whatever /api/vibecode/scan returned. The route decides how much
// of the plan a caller may see, so this component's job is to make the
// locked half legible rather than to hide anything itself — everything it is
// given, it shows.
//
// Copy rule, same as the dashboard's DiscoveredCreatorCard: these creators
// have not signed up and have not agreed to work with anyone. Nothing here
// may imply they are available, interested, or vetted by us.
export default function VibecodeResults({ data, appUrl }) {
  const locked = Boolean(data.locked);
  const ideas = data.plan?.video_ideas || [];
  const lockedIdeas = data.plan?.locked_idea_count || 0;
  const creatorCount = locked ? data.creator_count : (data.creators?.length ?? 0);

  const signupHref = `/signup?role=brand&from=scan${
    appUrl ? `&app=${encodeURIComponent(appUrl)}` : ""
  }`;

  return (
    <div className="mx-auto mt-12 max-w-5xl px-6 text-left">
      <AppCard app={data.app} plan={data.plan} />

      {/* ---- Videos to make ---- */}
      <section className="mt-10">
        <SectionHeading
          title="Videos to make"
          note={
            lockedIdeas > 0
              ? `${ideas.length} of ${ideas.length + lockedIdeas} shown`
              : `${ideas.length} concepts`
          }
        />
        <div className="mt-5 space-y-3">
          {ideas.map((idea, i) => (
            <IdeaCard key={i} idea={idea} index={i} />
          ))}
          {lockedIdeas > 0 && <LockedIdeas count={lockedIdeas} />}
        </div>
      </section>

      {/* ---- Creators ---- */}
      <section className="mt-10">
        <SectionHeading
          title="Creators in this niche"
          note={
            creatorCount > 0
              ? `${creatorCount} found${locked ? ` · ${Math.min(2, creatorCount)} shown` : ""}`
              : null
          }
        />

        {data.coverage === "thin" ? (
          <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-amber-900">
            We&apos;re still expanding creator coverage for this niche, so there
            isn&apos;t a full shortlist yet — we&apos;ve queued the searches and
            it&apos;ll fill in. The video concepts above still apply, and you can
            brief them to any small creator whose audience overlaps your users.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(data.creators || []).map((c) => (
              <CreatorCard key={c.id} creator={c} locked={locked} />
            ))}
          </div>
        )}
      </section>

      {locked && <UnlockBand creatorCount={creatorCount} lockedIdeas={lockedIdeas} href={signupHref} />}
    </div>
  );
}

function SectionHeading({ title, note }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-slate-200 pb-3">
      <h3 className="font-display text-2xl font-bold text-brand-ink">{title}</h3>
      {note && <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">{note}</span>}
    </div>
  );
}

function AppCard({ app, plan }) {
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
        {plan?.summary && <p className="mt-2 text-sm leading-relaxed text-slate-600">{plan.summary}</p>}
        {plan?.audience && (
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            <span className="font-semibold text-brand-ink">Who posts about this:</span> {plan.audience}
          </p>
        )}
        {plan?.niche_tags?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {plan.niche_tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-slate-200 px-2.5 py-0.5 text-[11px] font-medium text-slate-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function IdeaCard({ idea, index }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-skyDeep to-brand-sky text-xs font-bold text-white">
          {index + 1}
        </span>
        <div className="min-w-0">
          <p className="font-display text-lg font-bold leading-snug text-brand-ink">
            &ldquo;{idea.hook}&rdquo;
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{idea.format}</p>
          <p className="mt-2 flex items-start gap-1.5 text-sm leading-relaxed text-slate-500">
            <Sparkles size={14} className="mt-0.5 shrink-0 text-brand-sky" />
            {idea.why}
          </p>
        </div>
      </div>
    </div>
  );
}

function LockedIdeas({ count }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
      {/* Placeholder bars rather than blurred real text — there is nothing to
          blur here, the route never sent the locked ideas to the browser. */}
      <div aria-hidden className="space-y-3 opacity-40">
        {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-2/3 rounded-full bg-slate-300" />
            <div className="h-3 w-full rounded-full bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-slate-50 via-slate-50/90 to-slate-50/60">
        <p className="flex items-center gap-2 text-sm font-semibold text-brand-ink">
          <Lock size={15} className="text-brand-skyDeep" />
          {count} more video {count === 1 ? "concept" : "concepts"}
        </p>
      </div>
    </div>
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
                // TikTok CDN URLs are signed and expire, and every sync
                // rewrites them, so next/image would cache a dead signature.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.thumbnail_url} alt="" loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-300">
                  <Play size={16} />
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
            <div className="min-w-0 flex-1 space-y-1.5" aria-label="Creator hidden until you start a trial">
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

function UnlockBand({ creatorCount, lockedIdeas, href }) {
  const bits = [
    creatorCount > 0 ? `all ${creatorCount} creators` : null,
    lockedIdeas > 0 ? `${lockedIdeas} more video ${lockedIdeas === 1 ? "concept" : "concepts"}` : null,
  ].filter(Boolean);

  return (
    <div className="mt-10 rounded-3xl bg-brand-ink px-6 py-8 text-center sm:px-10">
      <h3 className="font-display text-2xl font-bold text-white sm:text-3xl">
        Unlock {bits.length > 0 ? bits.join(" and ") : "the full plan"}
      </h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
        Start the free trial to see who to contact, get the full set of concepts,
        and run the campaign — tracking every video and paying per post from one
        place.
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
