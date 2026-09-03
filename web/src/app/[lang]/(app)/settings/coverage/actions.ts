"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/server";

export async function createCoverage(formData: FormData) {
  const siteId = formData.get("siteId") as string;
  const weekday = Number(formData.get("weekday"));
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const minCount = Number(formData.get("minCount"));
  const roleId = formData.get("roleId") as string;
  const areaId = (formData.get("areaId") as string) || null;
  const label = (formData.get("label") as string)?.trim() || null;

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
  const id = formData.get("id") as string;
  const weekday = Number(formData.get("weekday"));
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const minCount = Number(formData.get("minCount"));
  const roleId = formData.get("roleId") as string;
  const areaId = (formData.get("areaId") as string) || null;
  const label = (formData.get("label") as string)?.trim() || null;

  const supa = db();
  const { error } = await supa
    .from("coverage_requirement")
    .update({ weekday, start_time: startTime, end_time: endTime, min_count: minCount, role_id: roleId, area_id: areaId, label })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/settings/coverage");
  return {};
}

export async function deleteCoverage(id: string) {
  const supa = db();
  await supa.from("coverage_requirement").delete().eq("id", id);
  revalidatePath("/settings/coverage");
}
