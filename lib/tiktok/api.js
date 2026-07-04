// Thin wrapper around TikTok's Login Kit + Display API (v2). Server-only.
const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const USER_INFO_URL =
  "https://open.tiktokapis.com/v2/user/info/?fields=open_id,username,display_name";
const VIDEO_LIST_URL = "https://open.tiktokapis.com/v2/video/list/";
const VIDEO_QUERY_URL = "https://open.tiktokapis.com/v2/video/query/";

function credentials() {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  if (!clientKey || !clientSecret) {
    throw new Error("TikTok is not configured (TIKTOK_CLIENT_KEY/SECRET missing).");
  }
  return { clientKey, clientSecret };
}

// Exchange an authorization code for an access/refresh token pair.
export async function exchangeCodeForToken(code, redirectUri) {
  const { clientKey, clientSecret } = credentials();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error_description || json.error || "TikTok token exchange failed.");
  }
  return json; // { access_token, refresh_token, expires_in, open_id, scope, ... }
}

// Exchange a refresh token for a new access token.
export async function refreshAccessToken(refreshToken) {
  const { clientKey, clientSecret } = credentials();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error_description || json.error || "TikTok token refresh failed.");
  }
  return json;
}

export async function fetchBasicUserInfo(accessToken) {
  const res = await fetch(USER_INFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await res.json();
  if (!res.ok || json.error?.code === "error") {
    throw new Error(json.error?.message || "TikTok user info fetch failed.");
  }
  return json?.data?.user || null; // { open_id, username, display_name }
}

// Paginated list of the creator's own posted videos (basic fields only).
export async function fetchVideoList(accessToken, cursor = 0) {
  const res = await fetch(
    `${VIDEO_LIST_URL}?fields=id,video_description,create_time,share_url,view_count,like_count,comment_count,share_count`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ max_count: 20, cursor }),
    },
  );
  const json = await res.json();
  if (!res.ok || json.error?.code === "error") {
    throw new Error(json.error?.message || "TikTok video list fetch failed.");
  }
  return {
    videos: json?.data?.videos || [],
    cursor: json?.data?.cursor ?? 0,
    hasMore: Boolean(json?.data?.has_more),
  };
}

// Refresh view/like/comment/share counts for a known set of video ids.
export async function fetchVideoStats(accessToken, videoIds) {
  if (!videoIds.length) return [];
  const res = await fetch(
    `${VIDEO_QUERY_URL}?fields=id,view_count,like_count,comment_count,share_count`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filters: { video_ids: videoIds } }),
    },
  );
  const json = await res.json();
  if (!res.ok || json.error?.code === "error") {
    throw new Error(json.error?.message || "TikTok video stats fetch failed.");
  }
  return json?.data?.videos || [];
}
