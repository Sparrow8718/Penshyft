"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/server";
import { logAudit } from "@/lib/db/audit";
import { getSession } from "@/lib/auth/session";

export async function createShift(formData: FormData) {
  const siteId = formData.get("siteId") as string;
  const date = formData.get("date") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const roleId = formData.get("roleId") as string;
  const areaId = (formData.get("areaId") as string) || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!date || !startTime || !endTime || !roleId) {
    return { error: "Date, times, and role are required." };
  }

  const supa = db();
  const { error } = await supa.from("shift").insert({
    site_id: siteId,
    date,
    start_time: startTime,
    end_time: endTime,
    role_id: roleId,
    area_id: areaId,
    notes,
    source: "manual",
    status: "open",
  });

  if (error) return { error: error.message };

  const s = await getSession();
  if (s) logAudit({ orgId: s.orgId, actor: s.memberName, action: "shift.created", entity: `shift`, meta: { date, roleId } });

  revalidatePath("/shifts");
  revalidatePath("/dashboard");
  return {};
}

export async function updateShift(formData: FormData) {
  const shiftId = formData.get("shiftId") as string;
  const date = formData.get("date") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const roleId = formData.get("roleId") as string;
  const areaId = (formData.get("areaId") as string) || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  const supa = db();
  const { error } = await supa
    .from("shift")
    .update({ date, start_time: startTime, end_time: endTime, role_id: roleId, area_id: areaId, notes })
    .eq("id", shiftId);

  if (error) return { error: error.message };

  const s = await getSession();
  if (s) logAudit({ orgId: s.orgId, actor: s.memberName, action: "shift.updated", entity: `shift:${shiftId}` });

  revalidatePath("/shifts");
  revalidatePath("/dashboard");
  return {};
}

export async function cancelShift(shiftId: string) {
  const supa = db();
  await supa.from("shift").update({ status: "cancelled" }).eq("id", shiftId);

  const s = await getSession();
  if (s) logAudit({ orgId: s.orgId, actor: s.memberName, action: "shift.cancelled", entity: `shift:${shiftId}` });

  revalidatePath("/shifts");
  revalidatePath("/dashboard");
}

export async function assignShift(shiftId: string, staffId: string | null) {
  const supa = db();
  await supa
    .from("shift")
    .update({
      filled_by: staffId,
      status: staffId ? "filled" : "open",
      filled_at: staffId ? new Date().toISOString() : null,
    })
    .eq("id", shiftId);

  const s = await getSession();
  if (s) logAudit({ orgId: s.orgId, actor: s.memberName, action: staffId ? "shift.assigned" : "shift.unassigned", entity: `shift:${shiftId}` });

  revalidatePath("/shifts");
  revalidatePath("/dashboard");
}
