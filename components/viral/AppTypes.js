import { AppWindow, Smartphone, Wrench } from "lucide-react";
import { FadeIn } from "@/hooks/useFadeIn";

const AUDIENCES = [
  { icon: Smartphone, title: "Apps", body: "On the App Store, and people need to find it." },
  { icon: AppWindow, title: "SaaS", body: "A web product that needs its first paying users." },
  { icon: Wrench, title: "Side projects", body: "You built it. Now someone has to hear about it." },
];

export default function AppTypes() {
  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <FadeIn>
          <h2 className="text-center font-display text-3xl font-bold tracking-tight text-brand-ink sm:text-5xl">
            Who it&apos;s for
          </h2>
        </FadeIn>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {AUDIENCES.map(({ icon: Icon, title, body }, i) => (
            <FadeIn key={title} delay={80 * i} className="h-full">
              <div className="h-full rounded-3xl border border-slate-200 p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-mist text-brand-ink">
                  <Icon size={20} />
                </span>
                <h3 className="mt-4 font-display text-xl font-bold text-brand-ink">{title}</h3>
                <p className="mt-2 text-slate-500">{body}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
