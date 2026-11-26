"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, Lock, Play } from "lucide-react";
import { formatCount, tiktokProfileUrl } from "@/lib/discovery/directory";

// The plan, locked or unlocked. The server has already removed everything a
// free visitor may not see (lib/plan/preview.js), so the placeholder bars here
// stand in for text this page never received.
export default function PlanPreview({ data, appUrl, onStartOver }) {
  const { plan, app, locked } = data;
  const signupHref = `/signup?role=brand&from=scan&app=${encodeURIComponent(appUrl)}`;

  return (
    <div className="pt-8">
      <div className="flex items-center gap-4">
        {app?.iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={app.iconUrl} alt="" className="h-14 w-14 shrink-0 rounded-2xl bg-brand-mist object-cover" />
        ) : (
          <div className="h-14 w-14 shrink-0 rounded-2xl bg-brand-mist" />
        )}
        <div className="min-w-0">
          <h1 className="break-words font-display text-2xl font-bold sm:text-3xl">
            Your plan for {plan.appName}
          </h1>
          <p className="text-sm text-slate-500">
            Goal: {plan.goalLabel} · {plan.postsPerWeek} posts a week
          </p>
        </div>
      </div>

      <Videos plan={plan} />
      <Creators plan={plan} />
      <Message plan={plan} locked={locked} />
      <Brief plan={plan} locked={locked} />
      <Week plan={plan} />

      {locked && (
        <div className="mt-12 rounded-3xl bg-brand-ink px-6 py-8 text-center text-white">
          <h2 className="font-display text-2xl font-bold">Unlock your full plan</h2>
          <p className="mt-2 text-slate-300">3 days free, then $25/month. Cancel anytime.</p>
          <Link
            href={signupHref}
            className="mt-6 inline-flex rounded-full bg-white px-8 py-4 font-semibold text-brand-ink transition hover:bg-slate-100"
          >
            Create your account
          </Link>
          <p className="mx-auto mt-4 max-w-md text-xs text-slate-400">
            Creator pay is separate. Payouts through JriveContent add a 5% platform fee and card processing.
          </p>
        </div>
      )}

      <button type="button" onClick={onStartOver} className="mx-auto mt-8 block py-2 text-sm text-slate-500 hover:text-brand-ink">
        Start over with another app
      </button>
    </div>
  );
}

function Section({ title, action, children }) {
  return (
    <section className="mt-12">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <h2 className="font-display text-xl font-bold sm:text-2xl">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Notice({ children }) {
  return <p className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{children}</p>;
}

function Bar({ className = "" }) {
  return <span aria-hidden="true" className={`block h-3 rounded-full bg-slate-200 ${className}`} />;
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the text is on screen to select by hand.
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-ink px-4 py-2 text-sm font-semibold text-white"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function Thumb({ src }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span className="flex h-full w-full items-center justify-center bg-slate-100">
        <Play size={18} className="text-slate-400" />
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" onError={() => setFailed(true)} className="h-full w-full object-cover" />;
}

function Videos({ plan }) {
  const { videos } = plan;
  const open = videos.filter((v) => !v.locked);

  return (
    <Section title={videos.length === 1 ? "1 video to recreate" : `${videos.length || 3} videos to recreate`}>
      {videos.length === 0 ? (
        <Notice>We don&apos;t have example videos to show yet.</Notice>
      ) : (
        videos.some((v) => v.outsideNiche) && (
          <Notice>
            We don&apos;t have enough videos in {plan.nicheLabel} yet, so the ones marked &ldquo;other niche&rdquo;
            are here for their format.
          </Notice>
        )
      )}

      {/* Capped so a tile whose preview didn't load isn't a huge empty box. */}
      <div className="mx-auto grid max-w-lg grid-cols-3 gap-2 sm:gap-4">
        {videos.map((v, i) => (
          <div key={i}>
            <div className="relative aspect-[9/13] overflow-hidden rounded-2xl bg-slate-100">
              <div className={`h-full w-full ${v.locked ? "blur-sm" : ""}`}>
                <Thumb src={v.thumbnail_url} />
              </div>
              {v.views > 0 && (
                <span className="absolute bottom-2 left-2 rounded bg-black/65 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                  {formatCount(v.views)} views
                </span>
              )}
              {v.locked && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="rounded-full bg-black/60 p-2.5 text-white">
                    <Lock size={16} aria-label="Locked" />
                  </span>
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Video {i + 1}
              {v.outsideNiche && " · other niche"}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {open.map((v) => (
          <WhyCopy key={v.video_url} video={v} number={videos.indexOf(v) + 1} />
        ))}
      </div>
    </Section>
  );
}

// Only what the numbers show. We don't analyse the video itself, so no claims
// about why it worked.
function WhyCopy({ video, number }) {
  const ratio = video.follower_count ? Math.floor(video.views / video.follower_count) : 0;
  return (
    <div className="rounded-2xl border border-slate-200 p-4 text-sm">
      <p className="font-semibold">Why copy video {number}</p>
      <p className="mt-1 text-slate-600">
        {formatCount(video.views)} views
        {video.follower_count ? ` from an account with ${formatCount(video.follower_count)} followers` : ""}
        {ratio >= 2 ? `, about ${ratio} times its following` : ""}.
        {video.likes > 0 && ` ${formatCount(video.likes)} likes.`}
      </p>
      {video.caption && <p className="mt-1 line-clamp-2 break-words text-slate-500">Caption: {video.caption}</p>}
      <a
        href={video.video_url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="mt-3 inline-flex items-center gap-1.5 font-semibold underline underline-offset-4"
      >
        Watch on TikTok <ExternalLink size={14} />
      </a>
    </div>
  );
}

function Creators({ plan }) {
  const { creators } = plan;
  const outside = creators.filter((c) => c.outsideNiche).length;

  return (
    <Section title={creators.length === 1 ? "1 creator" : `${creators.length} creators`}>
      {outside > 0 ? (
        <Notice>
          We only have {creators.length - outside} {creators.length - outside === 1 ? "creator" : "creators"} in{" "}
          {plan.nicheLabel} so far. The ones marked &ldquo;other niche&rdquo; make up the rest.
        </Notice>
      ) : (
        creators.length < 5 && <Notice>We found {creators.length} creators for this niche so far.</Notice>
      )}

      <ul className="space-y-2">
        {creators.map((c, i) => (
          <li key={i} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
            {c.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.avatar_url} alt="" className="h-11 w-11 shrink-0 rounded-full bg-slate-100 object-cover" />
            ) : (
              <span className="h-11 w-11 shrink-0 rounded-full bg-slate-200" />
            )}
            <div className="min-w-0 flex-1">
              {c.locked ? (
                <Bar className="w-28" />
              ) : (
                <p className="truncate font-semibold">
                  {c.name}
                  {c.handle && <span className="font-normal text-slate-500"> @{c.handle.replace(/^@/, "")}</span>}
                </p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                {[
                  c.source === "platform" ? "On JriveContent" : "Found on TikTok",
                  c.follower_count != null && `${formatCount(c.follower_count)} followers`,
                  c.rate,
                  c.outsideNiche ? "other niche" : c.niche,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            {c.locked ? (
              <Lock size={16} className="shrink-0 text-slate-400" aria-label="Locked" />
            ) : c.source === "platform" ? (
              <Link href={`/dashboard/brand/creators?invite=${encodeURIComponent(c.id)}`} className="shrink-0 text-sm font-semibold underline underline-offset-4">
                Invite
              </Link>
            ) : (
              <a
                href={tiktokProfileUrl(c.handle)}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="shrink-0 text-sm font-semibold underline underline-offset-4"
              >
                TikTok
              </a>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate-500">
        &ldquo;On JriveContent&rdquo; creators signed up for brand work. &ldquo;Found on TikTok&rdquo; are public
        accounts that haven&apos;t signed up, so you message them yourself.
      </p>
    </Section>
  );
}

function Notes({ notes }) {
  if (!notes?.length) return null;
  return (
    <ul className="mt-3 space-y-1 text-sm text-slate-500">
      {notes.map((n) => (
        <li key={n}>{n}</li>
      ))}
    </ul>
  );
}

function Message({ plan, locked }) {
  return (
    <Section title="Message to send" action={!locked && <CopyButton text={plan.message.join("\n")} />}>
      <div className="space-y-2 rounded-2xl border border-slate-200 p-4">
        {plan.message.map((line) => (
          <p key={line}>{line}</p>
        ))}
        {locked && (
          <div className="space-y-2 pt-2">
            <Bar className="w-11/12" />
            <Bar className="w-3/4" />
            <Bar className="w-1/2" />
            <p className="flex items-center gap-1.5 pt-1 text-sm text-slate-500">
              <Lock size={14} /> The rest of the message is locked
            </p>
          </div>
        )}
      </div>
      {!locked && <p className="mt-3 text-sm text-slate-500">Fill in anything in [brackets] before you send it.</p>}
      <Notes notes={plan.notes} />
    </Section>
  );
}

function Brief({ plan, locked }) {
  const text = locked ? "" : plan.brief.map((s) => `${s.heading}\n${s.lines.join("\n")}`).join("\n\n");
  return (
    <Section title="Brief" action={!locked && <CopyButton text={text} />}>
      <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
        {plan.brief.map((s) => (
          <div key={s.heading}>
            <p className="flex items-center gap-1.5 font-semibold">
              {s.heading}
              {locked && <Lock size={13} className="text-slate-400" aria-label="Locked" />}
            </p>
            {locked ? (
              <Bar className="mt-2 w-3/4" />
            ) : (
              s.lines.map((line) => (
                <p key={line} className="mt-1 text-slate-600">
                  {line}
                </p>
              ))
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

function Week({ plan }) {
  return (
    <Section title="This week">
      <ol className="space-y-2">
        {plan.week.map((d) => (
          <li key={d.day} className="flex gap-4 rounded-2xl border border-slate-200 p-4">
            <span className="w-12 shrink-0 text-sm font-semibold">Day {d.day}</span>
            {d.locked ? (
              <span className="flex flex-1 items-center justify-between gap-3">
                <Bar className="w-2/3" />
                <Lock size={14} className="shrink-0 text-slate-400" aria-label="Locked" />
              </span>
            ) : d.tasks.length ? (
              <ul className="flex-1 space-y-1 text-sm text-slate-700">
                {d.tasks.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            ) : (
              <span className="text-sm text-slate-500">Rest day</span>
            )}
          </li>
        ))}
      </ol>
    </Section>
  );
}
