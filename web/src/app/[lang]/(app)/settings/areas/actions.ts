"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/server";
import { getSession } from "@/lib/auth/session";
import { checkPlanLimit } from "@/lib/billing/check-limit";
import { siteInOrg, areaInOrg } from "@/lib/auth/guards";

export async function createArea(formData: FormData) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };

  const siteId = formData.get("siteId") as string;
  const name = (formData.get("name") as string).trim();

  if (!name) return { error: "Name is required." };
  if (!(await siteInOrg(siteId, s.orgId))) return { error: "Site not found." };

  const limit = await checkPlanLimit(s.orgId, "areas");
  if (!limit.allowed) {
    return { error: `Your ${limit.plan} plan allows max ${limit.max} areas. Upgrade to add more.` };
  }

  const supa = db();
  const { error } = await supa.from("area").insert({ site_id: siteId, name });
  if (error) return { error: error.message };

  revalidatePath("/settings/areas");
  return {};
}

export async function updateArea(formData: FormData) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };

  const areaId = formData.get("areaId") as string;
  const name = (formData.get("name") as string).trim();

  if (!name) return { error: "Name is required." };
  if (!(await areaInOrg(areaId, s.orgId))) return { error: "Area not found." };

  const supa = db();
  const { error } = await supa.from("area").update({ name }).eq("id", areaId);
  if (error) return { error: error.message };

  revalidatePath("/settings/areas");
  return {};
}

export async function archiveArea(areaId: string) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };
  if (!(await areaInOrg(areaId, s.orgId))) return { error: "Area not found." };

  const supa = db();
  await supa.from("area").update({ archived: true }).eq("id", areaId);
  revalidatePath("/settings/areas");
  return {};
}
