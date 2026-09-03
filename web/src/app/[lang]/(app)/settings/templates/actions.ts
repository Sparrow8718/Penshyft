"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/server";

export async function createTemplate(formData: FormData) {
  const siteId = formData.get("siteId") as string;
  const weekday = Number(formData.get("weekday"));
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const headcount = Number(formData.get("headcount"));
  const roleId = formData.get("roleId") as string;
  const areaId = (formData.get("areaId") as string) || null;

  const supa = db();
  const { error } = await supa.from("shift_template").insert({
    site_id: siteId,
    weekday,
    start_time: startTime,
    end_time: endTime,
    headcount,
    role_id: roleId,
    area_id: areaId,
  });

  if (error) return { error: error.message };
  revalidatePath("/settings/templates");
  return {};
}

export async function updateTemplate(formData: FormData) {
  const id = formData.get("id") as string;
  const weekday = Number(formData.get("weekday"));
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const headcount = Number(formData.get("headcount"));
  const roleId = formData.get("roleId") as string;
  const areaId = (formData.get("areaId") as string) || null;

  const supa = db();
  const { error } = await supa
    .from("shift_template")
    .update({ weekday, start_time: startTime, end_time: endTime, headcount, role_id: roleId, area_id: areaId })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/settings/templates");
  return {};
}

export async function deleteTemplate(id: string) {
  const supa = db();
  await supa.from("shift_template").delete().eq("id", id);
  revalidatePath("/settings/templates");
}

export async function toggleTemplate(id: string, active: boolean) {
  const supa = db();
  await supa.from("shift_template").update({ active }).eq("id", id);
  revalidatePath("/settings/templates");
}
