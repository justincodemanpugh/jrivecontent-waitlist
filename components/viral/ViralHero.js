import LinkBox from "./LinkBox";

// No entrance animation: the link box is the point of the page and has to be
// there immediately.
export default function ViralHero() {
  return (
    <section className="bg-white px-6 pb-20 pt-16 text-center sm:pt-24">
      <h1 className="mx-auto max-w-4xl font-display text-4xl font-bold leading-[1.1] tracking-tight text-brand-ink sm:text-6xl md:text-7xl">
        Get creators posting about your app<span className="text-brand-skyDeep">.</span>
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-500 sm:text-xl">
        Paste your link. Get creators, videos to copy, and what to send them.
      </p>
      <div className="mt-9">
        <LinkBox />
      </div>
      <p className="mt-4 text-sm text-slate-400">Free preview. No card needed.</p>
    </section>
  );
}
