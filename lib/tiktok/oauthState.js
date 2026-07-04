// Signed, stateless CSRF token for the TikTok OAuth round-trip. We don't
// have a server-side session store for this, so the creator's id + a
// timestamp are HMAC-signed with TIKTOK_CLIENT_SECRET and round-tripped
// through TikTok's `state` param instead.
import crypto from "crypto";

const MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes to complete the OAuth flow

function secret() {
  const value = process.env.TIKTOK_CLIENT_SECRET;
  if (!value) throw new Error("TIKTOK_CLIENT_SECRET is not set.");
  return value;
}

export function signState(creatorId) {
  const timestamp = Date.now().toString();
  const payload = `${creatorId}.${timestamp}`;
  const sig = crypto.createHmac("sha256", secret()).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function verifyState(state) {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8");
    const [creatorId, timestamp, sig] = decoded.split(".");
    if (!creatorId || !timestamp || !sig) return null;

    const payload = `${creatorId}.${timestamp}`;
    const expectedSig = crypto
      .createHmac("sha256", secret())
      .update(payload)
      .digest("hex");
    if (
      sig.length !== expectedSig.length ||
      !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))
    ) {
      return null;
    }
    if (Date.now() - Number(timestamp) > MAX_AGE_MS) return null;

    return creatorId;
  } catch {
    return null;
  }
}
