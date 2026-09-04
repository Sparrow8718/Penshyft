"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/server";
import { logAudit } from "@/lib/db/audit";
import { getSession } from "@/lib/auth/session";
import { siteInOrg } from "@/lib/auth/guards";

export async function addBlockedDate(formData: FormData) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };

  const siteId = formData.get("siteId") as string;
  const date = formData.get("date") as string;
  const reason = (formData.get("reason") as string)?.trim() || null;

  if (!date) return { error: "Date is required." };
  if (!(await siteInOrg(siteId, s.orgId))) return { error: "Site not found." };

  const supa = db();
  const { error } = await supa.from("site_blocked_date").insert({
    site_id: siteId,
    date,
    reason,
  });

  if (error) {
    if (error.code === "23505") return { error: "This date is already blocked." };
    return { error: error.message };
  }

  await logAudit({ orgId: s.orgId, actor: s.memberName, action: "blocked_date.added", meta: { date, reason } });
  revalidatePath("/settings/blocked-dates");
  revalidatePath("/rota");
  return {};
}

export async function removeBlockedDate(id: string) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };

  const supa = db();
  const { data: row } = await supa
    .from("site_blocked_date")
    .select("site_id")
    .eq("id", id)
    .single();

  if (!row) return { error: "Not found." };
  if (!(await siteInOrg(row.site_id, s.orgId))) return { error: "Not found." };

  await supa.from("site_blocked_date").delete().eq("id", id);

  await logAudit({ orgId: s.orgId, actor: s.memberName, action: "blocked_date.removed", meta: { id } });
  revalidatePath("/settings/blocked-dates");
  revalidatePath("/rota");
  return {};
}
