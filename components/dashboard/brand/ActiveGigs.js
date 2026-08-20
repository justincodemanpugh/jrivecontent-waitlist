import Link from "next/link";
import { ArrowRight } from "lucide-react";
import GigCard from "./GigCard";

export default function ActiveGigs({ gigs }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-ink">My active gigs</h2>
        <Link
          href="/dashboard/brand/gigs"
          className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:gap-1.5 transition-all"
        >
          View all
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {gigs.map((gig) => (
          <GigCard key={gig.id} gig={gig} />
        ))}
      </div>
    </section>
  );
}
