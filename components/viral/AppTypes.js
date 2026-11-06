import { Sparkles, Apple, Wand2, GraduationCap } from "lucide-react";
import { FadeIn } from "@/hooks/useFadeIn";

// Example app categories with the kind of hook a creator would open with.
// The hooks are illustrative, not quotes from real campaigns.
const APP_TYPES = [
  {
    icon: Sparkles,
    tint: "from-pink-100 to-white",
    iconColor: "text-pink-500",
    title: "Beauty & skin scanners",
    hook: "I let an app rate my skin and it was brutally honest…",
  },
  {
    icon: Apple,
    tint: "from-green-100 to-white",
    iconColor: "text-green-600",
    title: "Calorie & fitness trackers",
    hook: "I took a photo of my lunch and this app counted the calories for me",
  },
  {
    icon: Wand2,
    tint: "from-violet-100 to-white",
    iconColor: "text-violet-500",
    title: "AI photo & utility apps",
    hook: "POV: you found the app that fixes every bad photo in your camera roll",
  },
  {
    icon: GraduationCap,
    tint: "from-amber-100 to-white",
    iconColor: "text-amber-600",
    title: "Study & productivity apps",
    hook: "The app that got me through finals week (not sponsored… okay, a little)",
  },
];

export default function AppTypes() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn>
          <h2 className="text-center font-display text-4xl font-bold tracking-tight text-brand-ink sm:text-5xl md:text-6xl">
            Made for apps people use every day
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-center text-lg text-slate-500">
            Consumer apps grow on short videos. Creators show your app in action, the way their followers actually discover new apps.
          </p>
        </FadeIn>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {APP_TYPES.map(({ icon: Icon, tint, iconColor, title, hook }, i) => (
            <FadeIn key={title} delay={80 * (i + 1)} className="h-full">
              <div className={`flex h-full flex-col rounded-2xl border border-slate-200 bg-gradient-to-b ${tint} p-6 shadow-sm`}>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm">
                  <Icon size={20} className={iconColor} />
                </span>
                <h3 className="mt-5 font-display text-lg font-bold text-brand-ink">{title}</h3>
                <div className="mt-4 rounded-xl bg-white/80 p-4 ring-1 ring-slate-100">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Example hook</p>
                  <p className="mt-1.5 text-sm italic leading-relaxed text-slate-600">&ldquo;{hook}&rdquo;</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
