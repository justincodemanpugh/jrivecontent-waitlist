import { redirect } from "next/navigation";

// Legacy entrypoint. The auth UI has been split into /signin (returning users)
// and /signup (new users). Preserve the old `next` and `role` params so any
// in-flight bookmarks or magic links land on the right successor page.
export default function LegacyLoginPage({ searchParams }) {
  const role = searchParams?.role;
  const next = searchParams?.next;
  const target = role ? "/signup" : "/signin";
  const params = new URLSearchParams();
  if (role) params.set("role", role);
  if (next) params.set("next", next);
  const qs = params.toString();
  redirect(qs ? `${target}?${qs}` : target);
}
