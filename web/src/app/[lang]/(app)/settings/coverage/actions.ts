"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/server";
import { getSession } from "@/lib/auth/session";
import { siteInOrg, roleInOrg, areaInOrg, getOrgSiteIds } from "@/lib/auth/guards";

export async function createCoverage(formData: FormData) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };

  const siteId = formData.get("siteId") as string;
  const weekday = Number(formData.get("weekday"));
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const minCount = Number(formData.get("minCount"));
  const roleId = formData.get("roleId") as string;
  const areaId = (formData.get("areaId") as string) || null;
  const label = (formData.get("label") as string)?.trim() || null;

  if (!(await siteInOrg(siteId, s.orgId))) return { error: "Site not found." };
  if (!(await roleInOrg(roleId, s.orgId))) return { error: "Invalid role." };
  if (areaId && !(await areaInOrg(areaId, s.orgId))) return { error: "Invalid area." };

  const supa = db();
  const { error } = await supa.from("coverage_requirement").insert({
    site_id: siteId,
    weekday,
    start_time: startTime,
    end_time: endTime,
    min_count: minCount,
    role_id: roleId,
    area_id: areaId,
    label,
  });

  if (error) return { error: error.message };
  revalidatePath("/settings/coverage");
  return {};
}

export async function updateCoverage(formData: FormData) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };

  const id = formData.get("id") as string;
  const weekday = Number(formData.get("weekday"));
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const minCount = Number(formData.get("minCount"));
  const roleId = formData.get("roleId") as string;
  const areaId = (formData.get("areaId") as string) || null;
  const label = (formData.get("label") as string)?.trim() || null;

  if (roleId && !(await roleInOrg(roleId, s.orgId))) return { error: "Invalid role." };
  if (areaId && !(await areaInOrg(areaId, s.orgId))) return { error: "Invalid area." };

  const siteIds = await getOrgSiteIds(s.orgId);
  if (siteIds.length === 0) return { error: "Not found." };

  const supa = db();
  const { error } = await supa
    .from("coverage_requirement")
    .update({ weekday, start_time: startTime, end_time: endTime, min_count: minCount, role_id: roleId, area_id: areaId, label })
    .eq("id", id)
    .in("site_id", siteIds);

  if (error) return { error: error.message };
  revalidatePath("/settings/coverage");
  return {};
}

export async function deleteCoverage(id: string) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };

  const siteIds = await getOrgSiteIds(s.orgId);
  if (siteIds.length === 0) return { error: "Not found." };

  const supa = db();
  await supa.from("coverage_requirement").delete().eq("id", id).in("site_id", siteIds);
  revalidatePath("/settings/coverage");
  return {};
}
