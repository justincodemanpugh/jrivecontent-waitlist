// One-scrape-per-creator sync for the TikTok @handle fallback. Server-only.
//
// A creator can be in several campaigns at once; syncProgramMemberVideos scrapes
// per membership. This helper scrapes the public profile once, writes the same
// videos into every subscribed-brand membership passed in, and stamps the
// creator_profiles.tiktok_handle_sync_* columns so the creator UI can show
// whether the last check actually worked.
//
// Used by:
//   - app/api/programs/member-sync   (creator saves/updates their handle)
//   - app/api/programs/apify-sync     (daily cron, grouped by creator_id)
import { fetchVideosForUsername } from "@/lib/apify/tiktokScraper";
import { upsertProgramMemberVideos, PROGRAM_VIDEO_LIMIT } from "@/lib/apify/sync";

// `memberIds` must already be filtered to active memberships whose campaign
// brand has an active subscription — it may be empty, in which case the scrape
// still runs (to validate the handle for the creator) but no program_videos
// rows are written and the status lands on 'skipped'.
export async function syncCreatorHandle(admin, { creatorId, handle, memberIds = [] }) {
  const now = new Date().toISOString();

  let videos;
  try {
    ({ videos } = await fetchVideosForUsername(handle, { limit: PROGRAM_VIDEO_LIMIT }));
  } catch (e) {
    await admin
      .from("creator_profiles")
      .update({
        tiktok_handle_synced_at: now,
        tiktok_handle_sync_status: "error",
        tiktok_handle_sync_error: (e.message || "Scrape failed").slice(0, 500),
      })
      .eq("user_id", creatorId);
    return { ok: false, error: e.message || "Scrape failed", videoCount: 0, membersSynced: 0 };
  }

  let membersSynced = 0;
  let videosUpserted = 0;
  const memberErrors = [];
  if (videos.length) {
    for (const memberId of memberIds) {
      try {
        videosUpserted += await upsertProgramMemberVideos(admin, { memberId, videos });
        membersSynced += 1;
      } catch (e) {
        console.error(`[handleSync] upsert failed for member ${memberId}`, e);
        memberErrors.push({ memberId, error: e.message });
      }
    }
  }

  await admin
    .from("creator_profiles")
    .update({
      tiktok_handle_synced_at: now,
      tiktok_handle_video_count: videos.length,
      tiktok_handle_sync_error: null,
      tiktok_handle_sync_status: memberIds.length ? "ok" : "skipped",
    })
    .eq("user_id", creatorId);

  return {
    ok: true,
    videoCount: videos.length,
    videosUpserted,
    membersSynced,
    skipped: memberIds.length === 0,
    memberErrors,
  };
}
