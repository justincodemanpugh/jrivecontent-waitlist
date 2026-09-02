// Shared Apify -> Supabase sync helpers. Server-only.
//
// Used by both the scheduled sync (app/api/programs/apify-sync) and the
// brand's "Track Accounts" dialog (app/api/tracked-accounts), which syncs
// newly added accounts immediately so the table isn't empty until the next
// cron run.
import { fetchVideosForUsername } from "@/lib/apify/tiktokScraper";

export const PROGRAM_VIDEO_LIMIT = 30;

// Append one immutable metric snapshot per video so the dashboard charts have
// real history to plot. Both snapshot tables have the same shape, they just
// differ in name and in which column points back at the video.
async function insertSnapshots(admin, { table, foreignKey, saved, savedKey, videos }) {
  if (!saved?.length) return;

  const statsByVideoId = new Map(videos.map((v) => [v.id, v]));
  const snapshots = saved
    .map((row) => {
      const stat = statsByVideoId.get(row[savedKey]);
      if (!stat) return null;
      return {
        [foreignKey]: row.id,
        views: stat.view_count,
        likes: stat.like_count,
        comments: stat.comment_count,
        shares: stat.share_count,
      };
    })
    .filter(Boolean);

  if (!snapshots.length) return;
  const { error } = await admin.from(table).insert(snapshots);
  if (error) throw error;
}

// Scrape one creator's public videos into the *existing* program_videos /
// program_video_metric_snapshots tables — the same tables the official
// Display API sync writes to, so the brand dashboard needs no changes and
// switching back later requires no data migration.
export async function syncProgramMemberVideos(admin, { memberId, handle }) {
  const { videos } = await fetchVideosForUsername(handle, { limit: PROGRAM_VIDEO_LIMIT });
  if (!videos.length) return 0;
  return upsertProgramMemberVideos(admin, { memberId, videos });
}

// Write an already-scraped video list for one membership. Split out from
// syncProgramMemberVideos so a creator enrolled in several campaigns can be
// scraped once (see lib/apify/handleSync.syncCreatorHandle) instead of once
// per membership.
export async function upsertProgramMemberVideos(admin, { memberId, videos }) {
  if (!videos.length) return 0;

  const now = new Date().toISOString();
  const rows = videos.map((v) => ({
    program_member_id: memberId,
    tiktok_video_id: v.id,
    video_url: v.share_url,
    description: v.video_description,
    cover_image_url: v.cover_image_url,
    duration_seconds: v.duration,
    posted_at: v.create_time ? new Date(v.create_time * 1000).toISOString() : null,
    views: v.view_count,
    likes: v.like_count,
    comments: v.comment_count,
    shares: v.share_count,
    last_synced_at: now,
  }));

  const { data: saved, error } = await admin
    .from("program_videos")
    .upsert(rows, { onConflict: "program_member_id,tiktok_video_id" })
    .select("id, tiktok_video_id");
  if (error) throw error;

  await insertSnapshots(admin, {
    table: "program_video_metric_snapshots",
    foreignKey: "program_video_id",
    saved,
    savedKey: "tiktok_video_id",
    videos,
  });

  return saved?.length || 0;
}

// Scrape one brand-tracked account into tracked_account_videos /
// tracked_account_video_snapshots, then stamp the account's status. Failures
// are recorded on the row (status 'error' + last_error) so the brand can see
// why an account isn't reporting instead of just an empty table.
export async function syncTrackedAccount(admin, account) {
  try {
    const { videos } = await fetchVideosForUsername(account.username, {
      limit: account.video_limit || 30,
    });

    let count = 0;
    if (videos.length) {
      const now = new Date().toISOString();
      const rows = videos.map((v) => ({
        tracked_account_id: account.id,
        platform_video_id: v.id,
        video_url: v.share_url,
        description: v.video_description,
        cover_image_url: v.cover_image_url,
        duration_seconds: v.duration,
        posted_at: v.create_time ? new Date(v.create_time * 1000).toISOString() : null,
        views: v.view_count,
        likes: v.like_count,
        comments: v.comment_count,
        shares: v.share_count,
        last_synced_at: now,
      }));

      const { data: saved, error } = await admin
        .from("tracked_account_videos")
        .upsert(rows, { onConflict: "tracked_account_id,platform_video_id" })
        .select("id, platform_video_id");
      if (error) throw error;

      await insertSnapshots(admin, {
        table: "tracked_account_video_snapshots",
        foreignKey: "tracked_account_video_id",
        saved,
        savedKey: "platform_video_id",
        videos,
      });
      count = saved?.length || 0;
    }

    await admin
      .from("tracked_accounts")
      .update({
        status: "tracking",
        last_error: null,
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", account.id);

    return { ok: true, videosUpserted: count };
  } catch (e) {
    await admin
      .from("tracked_accounts")
      .update({
        status: "error",
        last_error: e.message?.slice(0, 500) || "Sync failed",
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", account.id);

    return { ok: false, videosUpserted: 0, error: e.message };
  }
}
