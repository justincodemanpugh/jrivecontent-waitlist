// A brand's invite link (/join/<token>) for a creator with no account. Server
// only. Whoever uses the link first is the creator the card means, so it is
// single-use; nothing is paid until the brand approves their videos.

const TOKEN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// What this person can do with this link.
export async function inviteState(admin, token, userId) {
  if (!TOKEN.test(String(token))) return { state: "invalid" };

  const { data: card, error } = await admin
    .from("brand_outreach")
    .select("id, brand_id, status, source, joined_creator_id")
    .eq("invite_token", token)
    .maybeSingle();
  if (error) throw error;
  // Platform cards already point at an account.
  if (!card || card.status === "removed" || card.source === "platform") return { state: "invalid" };

  const [{ data: brand }, { data: creator }, { data: ownBrand }] = await Promise.all([
    admin.from("brand_profiles").select("brand_name").eq("user_id", card.brand_id).maybeSingle(),
    admin.from("creator_profiles").select("onboarded_at").eq("user_id", userId).maybeSingle(),
    admin.from("brand_profiles").select("onboarded_at").eq("user_id", userId).maybeSingle(),
  ]);
  const about = { card, brandName: brand?.brand_name || "A brand" };

  if (card.joined_creator_id) {
    return card.joined_creator_id === userId ? { ...about, state: "joined" } : { state: "invalid" };
  }
  if (card.brand_id === userId || (ownBrand?.onboarded_at && !creator?.onboarded_at)) {
    return { ...about, state: "not_creator" };
  }
  return { ...about, state: creator?.onboarded_at ? "ready" : "needs_profile" };
}

export async function acceptInvite(admin, token, userId) {
  const invite = await inviteState(admin, token, userId);
  if (invite.state === "joined") return invite;
  if (invite.state !== "ready") return invite;
  const { card, brandName } = invite;

  // The null filter makes it single-use even if two people click at once.
  const { data: claimed, error } = await admin
    .from("brand_outreach")
    .update({ joined_creator_id: userId })
    .eq("id", card.id)
    .is("joined_creator_id", null)
    .select("id");
  if (error) throw error;
  if (!claimed?.length) return { state: "invalid" };

  // Connected creators can be invited to the brand's campaigns.
  const { error: connectError } = await admin
    .from("brand_creators")
    .upsert({ brand_id: card.brand_id, creator_id: userId, status: "active" }, { onConflict: "brand_id,creator_id" });
  if (connectError) throw connectError;

  const { error: notifyError } = await admin.from("notifications").insert({
    user_id: card.brand_id,
    type: "creator_joined",
    title: "A creator accepted your invite",
    body: "Set up their pay from your creator board.",
    link_url: "/dashboard/brand/board",
  });
  if (notifyError) console.error("[invite] notification failed", notifyError);

  return { state: "joined", card, brandName };
}
