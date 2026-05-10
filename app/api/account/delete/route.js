// POST /api/account/delete
// Permanently deletes the signed-in user's account.
//
// Strategy: use the service-role admin client to run a raw SQL delete
// against auth.users. We avoid `auth.admin.deleteUser()` because GoTrue
// wraps the delete in extra logic that has been observed to return
// `unexpected_failure` in this project (likely due to storage objects
// or auth-schema rows that GoTrue chokes on). A plain Postgres delete
// lets ON DELETE CASCADE clean up:
//   - public.brand_profiles / creator_profiles
//   - gigs, gig_applications, gig_invitations
//   - conversations, messages
//   - deliverables, deliverable_videos, creator_portfolio_videos
//   - payments
//   - auth.identities, auth.sessions, auth.refresh_tokens (all cascade
//     by default in Supabase's auth schema)
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 },
      );
    }

    const admin = createAdminClient();

    // Best-effort: clear the user's storage objects in the deliverables
    // bucket. Failures here shouldn't block the account deletion itself.
    try {
      // Conversations the user belonged to — their folders hold uploads.
      const { data: convos } = await admin
        .from("conversations")
        .select("id")
        .or(`brand_id.eq.${user.id},creator_id.eq.${user.id}`);

      if (convos && convos.length > 0) {
        for (const c of convos) {
          const { data: files } = await admin.storage
            .from("deliverables")
            .list(c.id, { limit: 1000 });
          if (files && files.length > 0) {
            await admin.storage
              .from("deliverables")
              .remove(files.map((f) => `${c.id}/${f.name}`));
          }
        }
      }
    } catch (storageErr) {
      console.warn("[account/delete] storage cleanup skipped", storageErr);
    }

    // Delete the auth user via raw SQL through the SECURITY DEFINER RPC.
    // The RPC checks auth.uid() so we call it with the *user's* session,
    // not the admin client.
    const { error: rpcError } = await supabase.rpc("delete_user_account");
    if (rpcError) {
      console.error("[account/delete] rpc failed", rpcError);
      return NextResponse.json(
        { error: rpcError.message || "Failed to delete account." },
        { status: 500 },
      );
    }

    // Clear the local session so the browser doesn't keep a stale token.
    await supabase.auth.signOut();

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[account/delete]", e);
    return NextResponse.json(
      { error: e.message || "Account deletion failed." },
      { status: 500 },
    );
  }
}
