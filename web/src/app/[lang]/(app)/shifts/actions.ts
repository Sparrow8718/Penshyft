"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/server";
import { logAudit } from "@/lib/db/audit";
import { getSession } from "@/lib/auth/session";
import { siteInOrg, shiftInOrg, staffInOrg, roleInOrg, areaInOrg } from "@/lib/auth/guards";

export async function createShift(formData: FormData) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };

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
  if (!(await siteInOrg(siteId, s.orgId))) return { error: "Site not found." };
  if (!(await roleInOrg(roleId, s.orgId))) return { error: "Invalid role." };
  if (areaId && !(await areaInOrg(areaId, s.orgId))) return { error: "Invalid area." };

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

  await logAudit({ orgId: s.orgId, actor: s.memberName, action: "shift.created", entity: `shift`, meta: { date, roleId } });

  revalidatePath("/shifts");
  revalidatePath("/dashboard");
  return {};
}

export async function updateShift(formData: FormData) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };

  const shiftId = formData.get("shiftId") as string;
  const date = formData.get("date") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const roleId = formData.get("roleId") as string;
  const areaId = (formData.get("areaId") as string) || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!(await shiftInOrg(shiftId, s.orgId))) return { error: "Shift not found." };
  if (roleId && !(await roleInOrg(roleId, s.orgId))) return { error: "Invalid role." };
  if (areaId && !(await areaInOrg(areaId, s.orgId))) return { error: "Invalid area." };

  const supa = db();
  const { error } = await supa
    .from("shift")
    .update({ date, start_time: startTime, end_time: endTime, role_id: roleId, area_id: areaId, notes })
    .eq("id", shiftId);

  if (error) return { error: error.message };

  await logAudit({ orgId: s.orgId, actor: s.memberName, action: "shift.updated", entity: `shift:${shiftId}` });

  revalidatePath("/shifts");
  revalidatePath("/dashboard");
  return {};
}

export async function cancelShift(shiftId: string) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };
  if (!(await shiftInOrg(shiftId, s.orgId))) return { error: "Shift not found." };

  const supa = db();
  await supa.from("shift").update({ status: "cancelled" }).eq("id", shiftId);

  await logAudit({ orgId: s.orgId, actor: s.memberName, action: "shift.cancelled", entity: `shift:${shiftId}` });

  revalidatePath("/shifts");
  revalidatePath("/dashboard");
  return {};
}

export async function createShiftBatch(formData: FormData) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };

  const siteId = formData.get("siteId") as string;
  const dates = (formData.get("dates") as string).split(",").filter(Boolean);
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const roleId = formData.get("roleId") as string;
  const areaId = (formData.get("areaId") as string) || null;
  const notes = (formData.get("notes") as string)?.trim() || null;
  const minStaff = Number(formData.get("minStaff")) || 1;

  if (dates.length === 0 || !startTime || !endTime || !roleId) {
    return { error: "Dates, times, and role are required." };
  }
  if (!(await siteInOrg(siteId, s.orgId))) return { error: "Site not found." };
  if (!(await roleInOrg(roleId, s.orgId))) return { error: "Invalid role." };
  if (areaId && !(await areaInOrg(areaId, s.orgId))) return { error: "Invalid area." };

  const rows = dates.flatMap((date) =>
    Array.from({ length: minStaff }, () => ({
      site_id: siteId,
      date,
      start_time: startTime,
      end_time: endTime,
      role_id: roleId,
      area_id: areaId,
      notes,
      source: "manual" as const,
      status: "open" as const,
    })),
  );

  const supa = db();
  const { error } = await supa.from("shift").insert(rows);
  if (error) return { error: error.message };

  await logAudit({ orgId: s.orgId, actor: s.memberName, action: "shift.batch_created", meta: { count: rows.length, dates: dates.length } });

  revalidatePath("/shifts");
  revalidatePath("/dashboard");
  return { created: rows.length };
}

export async function assignShift(shiftId: string, staffId: string | null) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };
  if (!(await shiftInOrg(shiftId, s.orgId))) return { error: "Shift not found." };
  if (staffId && !(await staffInOrg(staffId, s.orgId))) return { error: "Staff member not found." };

  const supa = db();
  await supa
    .from("shift")
    .update({
      filled_by: staffId,
      status: staffId ? "filled" : "open",
      filled_at: staffId ? new Date().toISOString() : null,
    })
    .eq("id", shiftId);

  await logAudit({ orgId: s.orgId, actor: s.memberName, action: staffId ? "shift.assigned" : "shift.unassigned", entity: `shift:${shiftId}` });

  revalidatePath("/shifts");
  revalidatePath("/dashboard");
  return {};
}
