// POST /api/programs/tiktok-sync
// Cron-triggered endpoint that refreshes TikTok video discovery + view/like/
// comment/share counts for every active program member.
//
// Trigger via Vercel Cron or external scheduler with:
//   POST /api/programs/tiktok-sync
//   Header: x-cron-secret: <CRON_SECRET>
//
// For each active program_member with a connected TikTok account:
//   1. Refresh the access token if it's near expiry.
//   2. Pull the creator's recent videos (video/list) and upsert new ones
//      into program_videos.
//   3. Refresh view/like/comment/share counts (video/query) for all known
//      videos, updating program_videos and inserting a metric snapshot.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { refreshAccessToken, fetchVideoList, fetchVideoStats } from "@/lib/tiktok/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOKEN_REFRESH_MARGIN_MS = 10 * 60 * 1000; // refresh if expiring within 10 min

export async function POST(request) {
  const secret = process.env.CRON_SECRET;
  const providedHeader = request.headers.get("x-cron-secret");
  const authHeader = request.headers.get("authorization");
  const providedAuth = authHeader?.replace("Bearer ", "");

  if (!secret || (providedHeader !== secret && providedAuth !== secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const results = { membersProcessed: 0, videosDiscovered: 0, videosUpdated: 0, errors: [] };

  const { data: members, error: membersErr } = await admin
    .from("program_members")
    .select("id, creator_id")
    .eq("status", "active");
  if (membersErr) {
    console.error("[tiktok-sync] failed to load program members", membersErr);
    return NextResponse.json({ error: membersErr.message }, { status: 500 });
  }

  for (const member of members || []) {
    try {
      const { data: account } = await admin
        .from("creator_social_accounts")
        .select("*")
        .eq("creator_id", member.creator_id)
        .eq("platform", "tiktok")
        .maybeSingle();
      if (!account) continue; // creator hasn't connected TikTok yet

      let accessToken = account.access_token;

      // Refresh token if it's expiring soon.
      const expiresAt = account.token_expires_at ? new Date(account.token_expires_at) : null;
      if (account.refresh_token && expiresAt && expiresAt.getTime() - Date.now() < TOKEN_REFRESH_MARGIN_MS) {
        const refreshed = await refreshAccessToken(account.refresh_token);
        accessToken = refreshed.access_token;
        await admin
          .from("creator_social_accounts")
          .update({
            access_token: refreshed.access_token,
            refresh_token: refreshed.refresh_token || account.refresh_token,
            token_expires_at: new Date(
              Date.now() + Number(refreshed.expires_in || 0) * 1000,
            ).toISOString(),
          })
          .eq("id", account.id);
      }

      // 1. Discover new videos.
      const { videos } = await fetchVideoList(accessToken);
      for (const video of videos) {
        const { data: existing } = await admin
          .from("program_videos")
          .select("id")
          .eq("program_member_id", member.id)
          .eq("tiktok_video_id", video.id)
          .maybeSingle();
        if (existing) continue;

        await admin.from("program_videos").insert({
          program_member_id: member.id,
          tiktok_video_id: video.id,
          video_url: video.share_url || null,
          posted_at: video.create_time
            ? new Date(Number(video.create_time) * 1000).toISOString()
            : null,
          views: video.view_count || 0,
          likes: video.like_count || 0,
          comments: video.comment_count || 0,
          shares: video.share_count || 0,
        });
        results.videosDiscovered += 1;
      }

      // 2. Refresh stats for all known videos on this membership.
      const { data: knownVideos } = await admin
        .from("program_videos")
        .select("id, tiktok_video_id")
        .eq("program_member_id", member.id);

      const videoIds = (knownVideos || []).map((v) => v.tiktok_video_id);
      if (videoIds.length) {
        const stats = await fetchVideoStats(accessToken, videoIds);
        const statsById = new Map(stats.map((s) => [s.id, s]));

        for (const known of knownVideos) {
          const stat = statsById.get(known.tiktok_video_id);
          if (!stat) continue;

          await admin
            .from("program_videos")
            .update({
              views: stat.view_count || 0,
              likes: stat.like_count || 0,
              comments: stat.comment_count || 0,
              shares: stat.share_count || 0,
              last_synced_at: new Date().toISOString(),
            })
            .eq("id", known.id);

          await admin.from("program_video_metric_snapshots").insert({
            program_video_id: known.id,
            views: stat.view_count || 0,
            likes: stat.like_count || 0,
            comments: stat.comment_count || 0,
            shares: stat.share_count || 0,
          });
          results.videosUpdated += 1;
        }
      }

      results.membersProcessed += 1;
    } catch (e) {
      console.error(`[tiktok-sync] failed for member ${member.id}`, e);
      results.errors.push({ program_member_id: member.id, error: e.message });
    }
  }

  return NextResponse.json({ ok: true, ...results });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
