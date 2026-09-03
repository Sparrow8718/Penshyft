"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/server";
import { checkPlanLimit } from "@/lib/billing/plans";

export async function createSite(formData: FormData) {
  const orgId = formData.get("orgId") as string;
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
  const siteId = formData.get("siteId") as string;
  const name = (formData.get("name") as string).trim();
  const address = (formData.get("address") as string)?.trim() || null;

  if (!name) return { error: "Name is required." };

  const supa = db();
  const { error } = await supa.from("site").update({ name, address }).eq("id", siteId);
  if (error) return { error: error.message };

  revalidatePath("/settings/sites");
  return {};
}

export async function archiveSite(siteId: string) {
  const supa = db();
  await supa.from("site").update({ archived: true }).eq("id", siteId);
  revalidatePath("/settings/sites");
}
