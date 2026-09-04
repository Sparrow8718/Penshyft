"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/server";
import { getSession } from "@/lib/auth/session";
import { siteInOrg, roleInOrg, areaInOrg, getOrgSiteIds } from "@/lib/auth/guards";

export async function createTemplate(formData: FormData) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };

  const siteId = formData.get("siteId") as string;
  const weekday = Number(formData.get("weekday"));
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const minStaff = Number(formData.get("minStaff")) || 1;
  const maxStaff = Number(formData.get("maxStaff")) || minStaff;
  const minHoursRaw = formData.get("minHours") as string;
  const maxHoursRaw = formData.get("maxHours") as string;
  const minHours = minHoursRaw ? Number(minHoursRaw) : null;
  const maxHours = maxHoursRaw ? Number(maxHoursRaw) : null;
  const roleId = formData.get("roleId") as string;
  const areaId = (formData.get("areaId") as string) || null;

  if (!(await siteInOrg(siteId, s.orgId))) return { error: "Site not found." };
  if (!(await roleInOrg(roleId, s.orgId))) return { error: "Invalid role." };
  if (areaId && !(await areaInOrg(areaId, s.orgId))) return { error: "Invalid area." };

  const supa = db();
  const { error } = await supa.from("shift_template").insert({
    site_id: siteId,
    weekday,
    start_time: startTime,
    end_time: endTime,
    min_staff: minStaff,
    max_staff: maxStaff,
    min_hours: minHours,
    max_hours: maxHours,
    role_id: roleId,
    area_id: areaId,
  });

  if (error) return { error: error.message };
  revalidatePath("/settings/templates");
  return {};
}

export async function updateTemplate(formData: FormData) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };

  const id = formData.get("id") as string;
  const weekday = Number(formData.get("weekday"));
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const minStaff = Number(formData.get("minStaff")) || 1;
  const maxStaff = Number(formData.get("maxStaff")) || minStaff;
  const minHoursRaw = formData.get("minHours") as string;
  const maxHoursRaw = formData.get("maxHours") as string;
  const minHours = minHoursRaw ? Number(minHoursRaw) : null;
  const maxHours = maxHoursRaw ? Number(maxHoursRaw) : null;
  const roleId = formData.get("roleId") as string;
  const areaId = (formData.get("areaId") as string) || null;

  if (roleId && !(await roleInOrg(roleId, s.orgId))) return { error: "Invalid role." };
  if (areaId && !(await areaInOrg(areaId, s.orgId))) return { error: "Invalid area." };

  const siteIds = await getOrgSiteIds(s.orgId);
  if (siteIds.length === 0) return { error: "Not found." };

  const supa = db();
  const { error } = await supa
    .from("shift_template")
    .update({ weekday, start_time: startTime, end_time: endTime, min_staff: minStaff, max_staff: maxStaff, min_hours: minHours, max_hours: maxHours, role_id: roleId, area_id: areaId })
    .eq("id", id)
    .in("site_id", siteIds);

  if (error) return { error: error.message };
  revalidatePath("/settings/templates");
  return {};
}

export async function deleteTemplate(id: string) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };

  const siteIds = await getOrgSiteIds(s.orgId);
  if (siteIds.length === 0) return { error: "Not found." };

  const supa = db();
  await supa.from("shift_template").delete().eq("id", id).in("site_id", siteIds);
  revalidatePath("/settings/templates");
  return {};
}

export async function toggleTemplate(id: string, active: boolean) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };

  const siteIds = await getOrgSiteIds(s.orgId);
  if (siteIds.length === 0) return { error: "Not found." };

  const supa = db();
  await supa.from("shift_template").update({ active }).eq("id", id).in("site_id", siteIds);
  revalidatePath("/settings/templates");
  return {};
}
