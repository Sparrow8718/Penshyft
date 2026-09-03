"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/server";
import { logAudit } from "@/lib/db/audit";

export async function startImpersonation(orgId: string) {
  const session = await requireSession();
  if (session.role !== "system_admin") return { error: "Forbidden" };

  const supa = db();
  const { data: org } = await supa
    .from("org")
    .select("id, name")
    .eq("id", orgId)
    .maybeSingle();

  if (!org) return { error: "Organisation not found" };

  const jar = await cookies();
  jar.set("sf-impersonate-org", orgId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 4,
  });

  logAudit({
    orgId: session.realOrgId,
    actor: session.memberId,
    action: "impersonate_start",
    entity: orgId,
    meta: { targetOrg: org.name },
  });

  revalidatePath("/");
  return { ok: true };
}

export async function stopImpersonation() {
  const session = await requireSession();

  const jar = await cookies();
  jar.delete("sf-impersonate-org");

  logAudit({
    orgId: session.realOrgId,
    actor: session.memberId,
    action: "impersonate_stop",
  });

  revalidatePath("/");
  return { ok: true };
}
