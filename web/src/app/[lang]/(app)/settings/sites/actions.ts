"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/server";
import { getSession } from "@/lib/auth/session";
import { checkPlanLimit } from "@/lib/billing/check-limit";
import { siteInOrg } from "@/lib/auth/guards";

export async function createSite(formData: FormData) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };
  const orgId = s.orgId;

  const name = (formData.get("name") as string).trim();
  const address = (formData.get("address") as string)?.trim() || null;

  if (!name) return { error: "Name is required." };

  const limit = await checkPlanLimit(orgId, "sites");
  if (!limit.allowed) {
    return { error: `Your ${limit.plan} plan allows max ${limit.max} sites. Upgrade to add more.` };
  }

  const supa = db();
  const { error } = await supa.from("site").insert({ org_id: orgId, name, address });
  if (error) return { error: error.message };

  revalidatePath("/settings/sites");
  return {};
}

export async function updateSite(formData: FormData) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };

  const siteId = formData.get("siteId") as string;
  const name = (formData.get("name") as string).trim();
  const address = (formData.get("address") as string)?.trim() || null;

  if (!name) return { error: "Name is required." };
  if (!(await siteInOrg(siteId, s.orgId))) return { error: "Site not found." };

  const supa = db();
  const { error } = await supa
    .from("site")
    .update({ name, address })
    .eq("id", siteId)
    .eq("org_id", s.orgId);
  if (error) return { error: error.message };

  revalidatePath("/settings/sites");
  return {};
}

export async function archiveSite(siteId: string) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };
  if (!(await siteInOrg(siteId, s.orgId))) return { error: "Site not found." };

  const supa = db();
  await supa.from("site").update({ archived: true }).eq("id", siteId).eq("org_id", s.orgId);
  revalidatePath("/settings/sites");
  return {};
}
