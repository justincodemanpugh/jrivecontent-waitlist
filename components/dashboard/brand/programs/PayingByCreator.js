"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Which creators brought paying users, from RevenueCat attributions. Shows
// nothing until there is at least one: without RevenueCat we can't know.
export default function PayingByCreator() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("revenue_attributions")
        .select("creator_id, first_purchase_at")
        .eq("brand_id", user.id)
        .not("first_purchase_at", "is", null);
      if (!data?.length) return;

      const counts = new Map();
      for (const r of data) counts.set(r.creator_id, (counts.get(r.creator_id) || 0) + 1);
      const { data: creators } = await supabase
        .from("creator_profiles")
        .select("user_id, display_name, handle")
        .in("user_id", [...counts.keys()]);
      const names = new Map((creators || []).map((c) => [c.user_id, c.display_name || c.handle]));

      if (cancelled) return;
      setRows(
        [...counts]
          .map(([id, paying]) => ({ id, paying, name: names.get(id) || "Creator" }))
          .sort((a, b) => b.paying - a.paying),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!rows.length) return null;

  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="text-base font-semibold text-ink">Paying users by creator</h2>
      <ul className="mt-3 divide-y divide-line">
        {rows.map((r) => (
          <li key={r.id} className="flex justify-between gap-4 py-2 text-sm">
            <span className="truncate text-ink-soft">{r.name}</span>
            <span className="font-semibold tabular-nums text-ink">{r.paying}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
