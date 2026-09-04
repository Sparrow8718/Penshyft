"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/server";
import { logAudit } from "@/lib/db/audit";
import { getSession } from "@/lib/auth/session";
import { siteInOrg, roleInOrg, areaInOrg, patternInOrg } from "@/lib/auth/guards";
import {
  computeHorizonDate,
  materializePattern,
  regeneratePatternShifts,
} from "@/lib/shifts/generate-from-pattern";

async function getOrgHorizon(orgId: string) {
  const { data } = await db()
    .from("org")
    .select("generation_horizon_unit, generation_horizon_value")
    .eq("id", orgId)
    .single();
  return data ?? { generation_horizon_unit: "months", generation_horizon_value: 1 };
}

export async function createShiftPattern(formData: FormData) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };

  const siteId = formData.get("siteId") as string;
  const roleId = formData.get("roleId") as string;
  const areaId = (formData.get("areaId") as string) || null;
  const weekdaysRaw = formData.get("weekdays") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = (formData.get("endDate") as string) || null;
  const minStaff = Number(formData.get("minStaff")) || 1;
  const autoGenerate = formData.get("autoGenerate") === "true";
  const notes = (formData.get("notes") as string)?.trim() || null;

  const weekdays = weekdaysRaw
    .split(",")
    .map(Number)
    .filter((n) => n >= 0 && n <= 6);

  if (weekdays.length === 0 || !startTime || !endTime || !roleId || !startDate) {
    return { error: "Weekdays, times, role, and start date are required." };
  }
  if (!(await siteInOrg(siteId, s.orgId))) return { error: "Site not found." };
  if (!(await roleInOrg(roleId, s.orgId))) return { error: "Invalid role." };
  if (areaId && !(await areaInOrg(areaId, s.orgId))) return { error: "Invalid area." };

  const supa = db();
  const { data: pattern, error } = await supa
    .from("shift_pattern")
    .insert({
      site_id: siteId,
      role_id: roleId,
      area_id: areaId,
      weekdays,
      start_time: startTime,
      end_time: endTime,
      start_date: startDate,
      end_date: endDate,
      min_staff: minStaff,
      auto_generate: autoGenerate,
      notes,
    })
    .select("id")
    .single();

  if (error || !pattern) return { error: error?.message ?? "Failed to create pattern." };

  const horizon = await getOrgHorizon(s.orgId);
  const horizonDate = computeHorizonDate(horizon);
  const { created } = await materializePattern(pattern.id, horizonDate);

  await logAudit({
    orgId: s.orgId,
    actor: s.memberName,
    action: "shift_pattern.created",
    entity: `shift_pattern:${pattern.id}`,
    meta: { weekdays, startDate, endDate, minStaff, autoGenerate, shiftsCreated: created },
  });

  revalidatePath("/shifts");
  revalidatePath("/dashboard");
  return { id: pattern.id, created };
}

export async function updateShiftPattern(formData: FormData) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };

  const patternId = formData.get("patternId") as string;
  if (!(await patternInOrg(patternId, s.orgId))) return { error: "Pattern not found." };

  const roleId = formData.get("roleId") as string;
  const areaId = (formData.get("areaId") as string) || null;
  const weekdaysRaw = formData.get("weekdays") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = (formData.get("endDate") as string) || null;
  const minStaff = Number(formData.get("minStaff")) || 1;
  const autoGenerate = formData.get("autoGenerate") === "true";
  const notes = (formData.get("notes") as string)?.trim() || null;

  const weekdays = weekdaysRaw
    .split(",")
    .map(Number)
    .filter((n) => n >= 0 && n <= 6);

  if (weekdays.length === 0 || !startTime || !endTime || !roleId || !startDate) {
    return { error: "Weekdays, times, role, and start date are required." };
  }
  if (!(await roleInOrg(roleId, s.orgId))) return { error: "Invalid role." };
  if (areaId && !(await areaInOrg(areaId, s.orgId))) return { error: "Invalid area." };

  const supa = db();
  const { error } = await supa
    .from("shift_pattern")
    .update({
      role_id: roleId,
      area_id: areaId,
      weekdays,
      start_time: startTime,
      end_time: endTime,
      start_date: startDate,
      end_date: endDate,
      min_staff: minStaff,
      auto_generate: autoGenerate,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", patternId);

  if (error) return { error: error.message };

  const horizon = await getOrgHorizon(s.orgId);
  const horizonDate = computeHorizonDate(horizon);
  const { deleted, created } = await regeneratePatternShifts(patternId, horizonDate);

  await logAudit({
    orgId: s.orgId,
    actor: s.memberName,
    action: "shift_pattern.updated",
    entity: `shift_pattern:${patternId}`,
    meta: { deleted, created },
  });

  revalidatePath("/shifts");
  revalidatePath("/dashboard");
  return { deleted, created };
}

export async function deleteShiftPattern(patternId: string, cancelFutureShifts = true) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };
  if (!(await patternInOrg(patternId, s.orgId))) return { error: "Pattern not found." };

  const supa = db();
  const todayStr = new Date().toISOString().slice(0, 10);

  let cancelled = 0;
  if (cancelFutureShifts) {
    const { data } = await supa
      .from("shift")
      .update({ status: "cancelled" })
      .eq("pattern_id", patternId)
      .eq("status", "open")
      .gt("date", todayStr)
      .select("id");
    cancelled = data?.length ?? 0;
  }

  await supa
    .from("shift_pattern")
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq("id", patternId);

  await logAudit({
    orgId: s.orgId,
    actor: s.memberName,
    action: "shift_pattern.deleted",
    entity: `shift_pattern:${patternId}`,
    meta: { cancelled },
  });

  revalidatePath("/shifts");
  revalidatePath("/dashboard");
  return { cancelled };
}

export async function toggleShiftPattern(patternId: string) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };
  if (!(await patternInOrg(patternId, s.orgId))) return { error: "Pattern not found." };

  const supa = db();
  const { data: current } = await supa
    .from("shift_pattern")
    .select("active")
    .eq("id", patternId)
    .single();

  if (!current) return { error: "Pattern not found." };

  const newActive = !current.active;
  await supa
    .from("shift_pattern")
    .update({ active: newActive, updated_at: new Date().toISOString() })
    .eq("id", patternId);

  if (newActive) {
    const horizon = await getOrgHorizon(s.orgId);
    const horizonDate = computeHorizonDate(horizon);
    await materializePattern(patternId, horizonDate);
  }

  await logAudit({
    orgId: s.orgId,
    actor: s.memberName,
    action: newActive ? "shift_pattern.resumed" : "shift_pattern.paused",
    entity: `shift_pattern:${patternId}`,
  });

  revalidatePath("/shifts");
  return { active: newActive };
}

export async function generateShiftsNow(patternId: string) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };
  if (!(await patternInOrg(patternId, s.orgId))) return { error: "Pattern not found." };

  const horizon = await getOrgHorizon(s.orgId);
  const horizonDate = computeHorizonDate(horizon);
  const { created } = await materializePattern(patternId, horizonDate);

  revalidatePath("/shifts");
  return { created };
}
