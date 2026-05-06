import { DollarSign, Link2, Video } from "lucide-react";

/**
 * Mirrors the creator-facing card so brands see exactly what will be published.
 */
export default function GigPreviewCard({ form }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {form.image ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={form.image.dataUrl}
          alt={form.image.name}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="h-48 bg-gradient-to-br from-brand-sky to-brand-skyDeep" />
      )}

      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-brand-ink leading-snug">
            {form.title || "Untitled gig"}
          </h3>
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-mist text-brand-skyDeep px-3 py-1 text-sm font-semibold shrink-0">
            <DollarSign size={14} />
            {form.payPerVideo || 0}/video
          </span>
        </div>

        <p className="mt-3 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
          {form.description || "No description yet."}
        </p>

        {form.examples.length > 0 && (
          <div className="mt-5 pt-5 border-t border-slate-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Reference videos
            </p>
            <ul className="mt-2 space-y-1.5">
              {form.examples.map((ex, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-sm text-slate-700"
                >
                  {ex.type === "url" ? (
                    <Link2 size={14} className="text-brand-skyDeep shrink-0" />
                  ) : (
                    <Video size={14} className="text-brand-skyDeep shrink-0" />
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
