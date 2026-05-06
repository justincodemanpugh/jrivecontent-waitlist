import Link from "next/link";
import { Users, Film, MessageSquare, ArrowRight, Sparkles } from "lucide-react";

const ICONS = {
  applicants: { Icon: Users, tint: "bg-emerald-50 text-emerald-600" },
  delivery: { Icon: Film, tint: "bg-amber-50 text-amber-600" },
  message: { Icon: MessageSquare, tint: "bg-sky-50 text-sky-600" },
};

export default function NeedsAttention({ items }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-brand-ink">
          Needs your attention
          {items.length > 0 && (
            <span className="ml-2 text-xs font-medium text-slate-500">
              ({items.length})
            </span>
          )}
        </h2>
      </div>

      {items.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <Sparkles size={22} className="mx-auto text-brand-skyDeep" />
          <p className="mt-2 text-sm text-slate-600">You&apos;re all caught up</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((item) => {
            const { Icon, tint } = ICONS[item.type] || ICONS.message;
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/70 transition group"
                >
                  <span className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${tint}`}>
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-brand-ink truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-brand-skyDeep group-hover:gap-1.5 transition-all">
                    {item.cta}
                    <ArrowRight size={14} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
