// For routes only a paying brand may use. Returns { response } to send back,
// or the signed-in user and the clients.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { brandHasActiveSubscription } from "@/lib/billing/subscription";

export async function requirePaid() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { response: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  }
  if (!(await brandHasActiveSubscription(supabase, user.id))) {
    return { response: NextResponse.json({ locked: true }) };
  }
  return { user, supabase, admin: createAdminClient() };
}
