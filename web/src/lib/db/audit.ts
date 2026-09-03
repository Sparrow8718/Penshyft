"use server";

import { db } from "./server";

export async function logAudit(args: {
  orgId: string;
  actor: string;
  action: string;
  entity?: string;
  meta?: Record<string, unknown>;
}) {
  try {
    await db().from("audit_log").insert({
      org_id: args.orgId,
      actor: args.actor,
      action: args.action,
      entity: args.entity ?? null,
      meta: (args.meta ?? null) as Record<string, unknown> as never,
    });
  } catch {
    // Fire-and-forget: audit failures must never break the main action
  }
}
