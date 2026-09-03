import "server-only";

import { db } from "./server";

// Plain server-only helper — NOT a server action. It must never be marked
// "use server", or it becomes an independently POST-able endpoint that would
// let a caller forge audit rows with arbitrary org_id/actor/action. Callers
// derive orgId/actor from the session and should `await` this.
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
