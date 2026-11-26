// Shared cron auth: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`;
// manual runs may send `x-cron-secret`.
export function isCronRequest(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const providedHeader = request.headers.get("x-cron-secret");
  const providedAuth = request.headers.get("authorization")?.replace("Bearer ", "");
  return providedHeader === secret || providedAuth === secret;
}
