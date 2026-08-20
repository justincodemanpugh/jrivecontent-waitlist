import { DollarSign, Link2, Video, Film } from "lucide-react";
import { platformLabel, contentTypeLabel } from "@/lib/dashboard/brand/gigForm";

/**
 * Mirrors the creator-facing card so brands see exactly what will be published.
 */
export default function GigPreviewCard({ form }) {
  return (
    <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-sm">
      {form.image ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={form.image.dataUrl}
          alt={form.image.name}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="h-48 bg-gradient-to-br from-accent-soft to-accent" />
      )}

      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-ink leading-snug">
            {form.title || "Untitled gig"}
          </h3>
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-tint text-accent px-3 py-1 text-sm font-semibold shrink-0">
            <DollarSign size={14} />
            {form.payPerVideo || 0}/video
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-hover text-ink-soft px-2.5 py-1 text-xs font-medium">
            <Film size={12} />
            {form.videoQuantity || 1} video{Number(form.videoQuantity) === 1 ? "" : "s"}
          </span>
          {form.contentType && (
            <span className="inline-flex items-center rounded-full bg-surface-hover text-ink-soft px-2.5 py-1 text-xs font-medium">
              {contentTypeLabel(form.contentType)}
            </span>
          )}
          {(form.platforms || []).map((p) => (
            <span
              key={p}
              className="inline-flex items-center rounded-full bg-accent-tint text-accent px-2.5 py-1 text-xs font-medium"
            >
              {platformLabel(p)}
            </span>
          ))}
        </div>

        <p className="mt-3 text-sm text-muted leading-relaxed whitespace-pre-wrap">
          {form.description || "No description yet."}
        </p>

        {form.examples.length > 0 && (
          <div className="mt-5 pt-5 border-t border-line">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Reference videos
            </p>
            <ul className="mt-2 space-y-1.5">
              {form.examples.map((ex, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-sm text-ink-soft"
                >
                  {ex.type === "url" ? (
                    <Link2 size={14} className="text-accent shrink-0" />
                  ) : (
                    <Video size={14} className="text-accent shrink-0" />
                  )}
                  <span className="truncate">{ex.value}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
