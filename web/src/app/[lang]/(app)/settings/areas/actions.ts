"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/server";
import { checkPlanLimit } from "@/lib/billing/plans";

export async function createArea(formData: FormData) {
  const siteId = formData.get("siteId") as string;
  const name = (formData.get("name") as string).trim();

  if (!name) return { error: "Name is required." };

  const supa = db();
  const { data: site } = await supa
    .from("site")
    .select("org_id")
    .eq("id", siteId)
    .single();
  if (!site) return { error: "Site not found." };

  const limit = await checkPlanLimit(site.org_id, "areas");
  if (!limit.allowed) {
    return { error: `Your ${limit.plan} plan allows max ${limit.max} areas. Upgrade to add more.` };
  }

  const { error } = await supa.from("area").insert({ site_id: siteId, name });
  if (error) return { error: error.message };

  revalidatePath("/settings/areas");
  return {};
}

export async function updateArea(formData: FormData) {
  const areaId = formData.get("areaId") as string;
  const name = (formData.get("name") as string).trim();

  if (!name) return { error: "Name is required." };

  const supa = db();
  const { error } = await supa.from("area").update({ name }).eq("id", areaId);
  if (error) return { error: error.message };

  revalidatePath("/settings/areas");
  return {};
}

export async function archiveArea(areaId: string) {
  const supa = db();
  await supa.from("area").update({ archived: true }).eq("id", areaId);
  revalidatePath("/settings/areas");
}
