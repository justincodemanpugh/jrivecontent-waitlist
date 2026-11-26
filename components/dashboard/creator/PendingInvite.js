"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { pendingInvite } from "@/lib/board/pendingInvite";

// For a creator who signed up from an invite link: the way back to accept it.
export default function PendingInvite() {
  const [token, setToken] = useState("");

  useEffect(() => {
    setToken(pendingInvite());
  }, []);

  if (!token) return null;

  return (
    <Link
      href={`/join/${encodeURIComponent(token)}`}
      className="flex items-center justify-between gap-4 rounded-2xl border border-accent-soft/60 bg-accent-tint px-4 py-3 text-sm font-semibold text-ink"
    >
      A brand invited you. Finish accepting their invite.
      <ArrowRight size={16} className="shrink-0" />
    </Link>
  );
}
