"use client";

import { BadgeCheck, ExternalLink, Heart, Link2, Users } from "lucide-react";
import {
  tiktokProfileUrl,
  formatCount,
  redactContact,
} from "@/lib/discovery/directory";

// A scraped TikTok profile, shown alongside signed-up creators in Browse
// Creators. Themed on the dashboard tokens (surface / ink / line / muted)
// rather than the marketing palette, so it follows dark mode like everything
// else in the dashboard.
//
// Copy rules, deliberate: these people have not signed up and have not agreed
// to work with anyone. Nothing here may imply availability, interest, or that
// we vetted them, and the verified badge is TikTok's, not ours. There is no
// Connect action on purpose — there is no account to connect to.
export default function DiscoveredCreatorCard({ creator }) {
  const {
    username, nickname, avatar_url, bio, bio_link,
    follower_count, avg_likes_per_video, avg_views, verified, niche_tags, videos,
  } = creator;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition hover:border-accent-soft/60 hover:shadow-md">
      {videos?.length > 0 && (
        <div className="grid grid-cols-3 gap-px bg-line">
          {videos.slice(0, 3).map((v, i) => (
            <a
              key={i}
              href={v.video_url || tiktokProfileUrl(username)}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="relative block aspect-[9/13] overflow-hidden bg-surface-sunken"
            >
              {v.thumbnail_url ? (
                // TikTok CDN URLs are signed and expire, and every sync
                // rewrites them, so next/image would cache a URL that outlives
                // its signature.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={v.thumbnail_url}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : null}
              {v.views > 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  {formatCount(v.views)}
                </span>
              )}
            </a>
          ))}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          {avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar_url}
              alt=""
              loading="lazy"
              className="h-11 w-11 shrink-0 rounded-full bg-surface-sunken object-cover"
            />
          ) : (
            <div className="h-11 w-11 shrink-0 rounded-full bg-surface-sunken" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="truncate font-semibold text-ink">{nickname || username}</p>
              {verified && (
                <BadgeCheck
                  size={16}
                  className="shrink-0 text-accent"
                  aria-label="Verified on TikTok"
                />
              )}
            </div>
            <p className="truncate text-sm text-muted">@{username}</p>
          </div>
        </div>

        {bio && (
          <p className="line-clamp-2 text-sm text-ink-soft">{redactContact(bio)}</p>
        )}

        <dl className="mt-auto grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-surface-sunken px-3 py-2">
            <dt className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted">
              <Users size={12} /> Followers
            </dt>
            <dd className="font-semibold text-ink">{formatCount(follower_count)}</dd>
          </div>
          <div className="rounded-lg bg-surface-sunken px-3 py-2">
            <dt className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted">
              <Heart size={12} /> Avg likes
            </dt>
            {/* Lifetime likes / post count. A sampled average would swing wildly
                on the ~1 video per creator a keyword search returns. */}
            <dd className="font-semibold text-ink">{formatCount(avg_likes_per_video)}</dd>
          </div>
        </dl>

        {avg_views != null && (
          <p className="text-xs text-muted">~{formatCount(avg_views)} views per video</p>
        )}

        {niche_tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {niche_tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-accent-tint px-2 py-0.5 text-[11px] font-medium text-accent"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <a
            href={tiktokProfileUrl(username)}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-ink px-3 py-2 text-sm font-semibold text-surface transition hover:opacity-90"
          >
            View on TikTok <ExternalLink size={14} />
          </a>
          {bio_link && (
            <a
              href={/^https?:\/\//i.test(bio_link) ? bio_link : `https://${bio_link}`}
              target="_blank"
              rel="noopener noreferrer nofollow"
              title="Creator's own link"
              className="flex items-center justify-center rounded-full border border-line px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-surface-hover"
            >
              <Link2 size={14} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
