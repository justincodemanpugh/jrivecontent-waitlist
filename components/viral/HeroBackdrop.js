import { PLATFORMS } from "./_shared";

const TILE_COUNT = 110;

/* Hand-picked so placement stays identical on server and client — a random
   scatter here would break hydration. */
const ICON_TILES = {
  3: "tiktok",
  9: "youtube",
  16: "instagram",
  22: "facebook",
  29: "tiktok",
  35: "instagram",
  44: "youtube",
  51: "tiktok",
  58: "facebook",
  66: "instagram",
  73: "tiktok",
  81: "youtube",
  88: "facebook",
  95: "instagram",
  103: "tiktok",
};

/* Two single-image masks on nested elements rather than one composited mask —
   mask-composite support is patchy, nesting is not. */
const FADE_MASK = "linear-gradient(to bottom, black 55%, transparent 100%)";
const CLEAR_MASK =
  "radial-gradient(ellipse 82% 55% at 50% 40%, transparent 22%, black 78%)";

export default function HeroBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-[680px] overflow-hidden opacity-[0.55]"
      style={{ maskImage: FADE_MASK, WebkitMaskImage: FADE_MASK }}
    >
      <div style={{ maskImage: CLEAR_MASK, WebkitMaskImage: CLEAR_MASK }}>
        <div className="grid gap-2 px-3 pt-6 grid-cols-[repeat(auto-fill,minmax(46px,1fr))] sm:gap-3 sm:grid-cols-[repeat(auto-fill,minmax(72px,1fr))]">
          {Array.from({ length: TILE_COUNT }, (_, i) => {
            const platform = ICON_TILES[i];
            return platform ? (
              <PlatformTile key={i} platform={platform} />
            ) : (
              <SkeletonTile key={i} />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PlatformTile({ platform }) {
  const { bg, Icon } = PLATFORMS[platform];
  return (
    <div className="flex aspect-square items-center justify-center">
      <span
        className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-white shadow-sm sm:h-9 sm:w-9 sm:rounded-xl ${bg}`}
      >
        <Icon size={17} />
      </span>
    </div>
  );
}

function SkeletonTile() {
  return (
    <div
      className="flex aspect-square items-center justify-center rounded-xl"
      style={{ border: "1px solid rgba(148,163,184,0.18)" }}
    >
      <div className="grid grid-cols-3 gap-[3px]">
        {Array.from({ length: 9 }, (_, i) => (
          <span
            key={i}
            className="h-[3px] w-[3px] rounded-full"
            style={{ background: "rgba(148,163,184,0.35)" }}
          />
        ))}
      </div>
    </div>
  );
}
