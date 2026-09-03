import "server-only";
import { notFound } from "next/navigation";

// The /dev tools (mock inbox, test email/push) must never be reachable on the
// production deployment. On Vercel, preview AND production both build with
// NODE_ENV=production; they're told apart by VERCEL_ENV. We allow /dev on
// local dev (VERCEL_ENV undefined) and preview, and block it only in
// production. Preview is itself behind Vercel SSO, so this is defense in depth.
export function devRoutesEnabled(): boolean {
  return process.env.VERCEL_ENV !== "production";
}

/** For pages/route handlers: render 404 when dev routes are disabled. */
export function assertDevRoutesEnabled(): void {
  if (!devRoutesEnabled()) notFound();
}
