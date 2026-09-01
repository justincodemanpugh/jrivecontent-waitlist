import { BadgeCheck, ExternalLink, Heart, Users } from "lucide-react";
import { tiktokProfileUrl, formatCount } from "@/lib/discovery/directory";

// One scraped TikTok profile. Server component — no interactivity beyond the
// outbound links, which keeps the whole grid in the server-rendered HTML.
//
// Copy rules, deliberate: these creators have not signed up and have not
// agreed to work with anyone. Nothing here may imply availability, interest,
// or that JriveContent vetted them. The verified badge is TikTok's, not ours.
export default function DiscoveredCreatorCard({ creator }) {
  const {
    username, nickname, avatar_url, bio, bio_link,
    follower_count, avg_likes_per_video, avg_views, verified, niche_tags, videos,
  } = creator;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      {videos?.length > 0 && (
        <div className="grid grid-cols-3 gap-px bg-slate-100">
          {videos.slice(0, 3).map((v, i) => (
            <a
              key={i}
              href={v.video_url || tiktokProfileUrl(username)}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="relative block aspect-[9/13] overflow-hidden bg-slate-100"
            >
              {v.thumbnail_url ? (
                // Signed, expiring TikTok CDN URLs refreshed on every sync, so
                // next/image optimization would cache a URL that outlives it.
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatar_url || "/images/jrive-logo.png"}
            alt=""
            loading="lazy"
            className="h-11 w-11 shrink-0 rounded-full bg-slate-100 object-cover"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="truncate font-semibold text-brand-ink">
                {nickname || username}
              </p>
              {verified && (
                <BadgeCheck
                  className="h-4 w-4 shrink-0 text-sky-500"
                  aria-label="Verified on TikTok"
                />
              )}
            </div>
            <p className="truncate text-sm text-slate-500">@{username}</p>
          </div>
        </div>

        {bio && <p className="line-clamp-2 text-sm text-slate-600">{bio}</p>}

        <dl className="mt-auto grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <dt className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-slate-500">
              <Users className="h-3 w-3" /> Followers
            </dt>
            <dd className="font-semibold text-brand-ink">{formatCount(follower_count)}</dd>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <dt className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-slate-500">
              <Heart className="h-3 w-3" /> Avg likes
            </dt>
            {/* Lifetime likes / post count, not a sampled average — see the
                note in migration 0042 on why sampled avg_views misleads. */}
            <dd className="font-semibold text-brand-ink">
              {formatCount(avg_likes_per_video)}
            </dd>
          </div>
        </dl>

        {avg_views != null && (
          <p className="text-xs text-slate-500">
            ~{formatCount(avg_views)} views per video
          </p>
        )}

        {niche_tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {niche_tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-brand-mist px-2 py-0.5 text-[11px] font-medium text-sky-700"
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
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-brand-ink px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            View on TikTok <ExternalLink className="h-3.5 w-3.5" />
          </a>
          {bio_link && (
            <a
              href={/^https?:\/\//i.test(bio_link) ? bio_link : `https://${bio_link}`}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="flex items-center justify-center rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              title="Creator's own link"
            >
              Link
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
