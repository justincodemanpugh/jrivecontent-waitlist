"use client";

// Renders a gig's example videos under the description on both the brand
// and creator gig detail pages. File-type entries (phone-recorded videos
// the brand uploaded) get an embedded <video> player in a 9:16 frame.
// URL-type entries fall back to a plain link.

export default function ExampleVideosSection({ examples }) {
  if (!Array.isArray(examples) || examples.length === 0) return null;

  const items = examples
    .map((ex) =>
      typeof ex === "string" ? { type: "url", value: ex } : ex || null
    )
    .filter((ex) => ex && (ex.value || ex.name));

  if (items.length === 0) return null;

  const videos = items.filter(
    (ex) => ex.type === "file" && /^https?:\/\//i.test(ex.value || "")
  );
  const links = items.filter((ex) => !videos.includes(ex));

  return (
    <section>
      <h2 className="text-sm font-semibold text-brand-ink mb-2">
        Example videos
      </h2>

      {videos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {videos.map((ex, i) => (
            <div
              key={`v-${i}`}
              className="relative aspect-[9/16] overflow-hidden rounded-xl bg-slate-900"
            >
              <video
                src={ex.value}
                controls
                playsInline
                preload="metadata"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      ) : null}

      {links.length > 0 ? (
        <ul className={`space-y-1.5 ${videos.length > 0 ? "mt-3" : ""}`}>
          {links.map((ex, i) => {
            const value = ex.value || ex.name || "";
            const isUrl = /^https?:\/\//i.test(value);
            return (
              <li key={`l-${i}`} className="text-sm">
                {isUrl ? (
                  <a
                    href={value}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-skyDeep hover:underline break-all"
                  >
                    {value}
                  </a>
                ) : (
                  <span className="text-slate-600">{value}</span>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
