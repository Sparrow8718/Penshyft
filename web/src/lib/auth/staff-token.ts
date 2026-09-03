import { createHmac, timingSafeEqual } from "node:crypto";

// Staff tokens gate the read-only staff portal and the iCal feed. Format is
// `staffId.iat.sig`, where iat is the issue time (base36 seconds) and sig =
// HMAC-SHA256(secret, "staffId.iat"). Embedding iat lets callers enforce a
// max age where appropriate (e.g. portal action links) while the calendar
// feed can stay long-lived. Note: full per-staff revocation (invalidating one
// departed staff member's link without rotating the global secret) requires a
// `staff.token_version` column and belongs with the future "share portal link"
// UI — nothing currently mints these tokens, so there is nothing to revoke yet.

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function generateStaffToken(staffId: string): string {
  const secret = process.env.STAFF_TOKEN_SECRET;
  if (!secret) throw new Error("STAFF_TOKEN_SECRET is not set");
  const iat = Math.floor(Date.now() / 1000).toString(36);
  const payload = `${staffId}.${iat}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyStaffToken(
  token: string,
  opts?: { maxAgeSeconds?: number },
): string | null {
  const secret = process.env.STAFF_TOKEN_SECRET;
  if (!secret) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [staffId, iat, sig] = parts;
  if (!staffId || !iat || !sig) return null;

  const expected = sign(`${staffId}.${iat}`, secret);
  if (!safeEqual(sig, expected)) return null;

  if (opts?.maxAgeSeconds != null) {
    const issued = parseInt(iat, 36);
    if (!Number.isFinite(issued)) return null;
    if (Date.now() / 1000 - issued > opts.maxAgeSeconds) return null;
  }

  return staffId;
}
