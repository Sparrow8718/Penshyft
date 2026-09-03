import { createHmac } from "node:crypto";

export function verifyStaffToken(token: string): string | null {
  const secret = process.env.STAFF_TOKEN_SECRET;
  if (!secret) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [staffId, sig] = parts;
  const expected = createHmac("sha256", secret)
    .update(staffId)
    .digest("base64url");
  if (sig !== expected) return null;
  return staffId;
}

export function generateStaffToken(staffId: string): string {
  const secret = process.env.STAFF_TOKEN_SECRET;
  if (!secret) throw new Error("STAFF_TOKEN_SECRET is not set");
  const sig = createHmac("sha256", secret)
    .update(staffId)
    .digest("base64url");
  return `${staffId}.${sig}`;
}
