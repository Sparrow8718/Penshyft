"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/server";
import { logAudit } from "@/lib/db/audit";
import { getSession } from "@/lib/auth/session";
import { checkPlanLimit } from "@/lib/billing/check-limit";
import { staffInOrg, allRolesInOrg, allAreasInOrg } from "@/lib/auth/guards";

export async function createStaff(formData: FormData) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };
  const orgId = s.orgId;

  const name = (formData.get("name") as string).trim();
  const email = (formData.get("email") as string)?.trim() || null;
  const mobile = (formData.get("mobile") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;
  const maxHoursPerWeekRaw = formData.get("maxHoursPerWeek") as string;
  const maxHoursPerDayRaw = formData.get("maxHoursPerDay") as string;
  const maxDaysPerWeekRaw = formData.get("maxDaysPerWeek") as string;
  const max_hours_per_week = maxHoursPerWeekRaw ? Number(maxHoursPerWeekRaw) : null;
  const max_hours_per_day = maxHoursPerDayRaw ? Number(maxHoursPerDayRaw) : null;
  const max_days_per_week = maxDaysPerWeekRaw ? Number(maxDaysPerWeekRaw) : null;

  if (!name) return { error: "Name is required." };

  const limit = await checkPlanLimit(orgId, "staff");
  if (!limit.allowed) {
    return { error: `Your ${limit.plan} plan allows max ${limit.max} active staff (currently ${limit.current}). Upgrade to add more.` };
  }

  const supa = db();
  const { data, error } = await supa
    .from("staff")
    .insert({ org_id: orgId, name, email, mobile, notes, max_hours_per_week, max_hours_per_day, max_days_per_week })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logAudit({ orgId, actor: s.memberName, action: "staff.created", entity: `staff:${data.id}`, meta: { name } });

  revalidatePath("/staff");
  return { staffId: data.id };
}

export async function updateStaff(formData: FormData) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };

  const staffId = formData.get("staffId") as string;
  const name = (formData.get("name") as string).trim();
  const email = (formData.get("email") as string)?.trim() || null;
  const mobile = (formData.get("mobile") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;
  const maxHoursPerWeekRaw = formData.get("maxHoursPerWeek") as string;
  const maxHoursPerDayRaw = formData.get("maxHoursPerDay") as string;
  const maxDaysPerWeekRaw = formData.get("maxDaysPerWeek") as string;
  const max_hours_per_week = maxHoursPerWeekRaw ? Number(maxHoursPerWeekRaw) : null;
  const max_hours_per_day = maxHoursPerDayRaw ? Number(maxHoursPerDayRaw) : null;
  const max_days_per_week = maxDaysPerWeekRaw ? Number(maxDaysPerWeekRaw) : null;

  if (!name) return { error: "Name is required." };
  if (!(await staffInOrg(staffId, s.orgId))) return { error: "Staff member not found." };

  const supa = db();
  const { error } = await supa
    .from("staff")
    .update({ name, email, mobile, notes, max_hours_per_week, max_hours_per_day, max_days_per_week })
    .eq("id", staffId)
    .eq("org_id", s.orgId);

  if (error) return { error: error.message };

  await logAudit({ orgId: s.orgId, actor: s.memberName, action: "staff.updated", entity: `staff:${staffId}` });

  revalidatePath("/staff");
  return {};
}

export async function archiveStaff(staffId: string) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };
  if (!(await staffInOrg(staffId, s.orgId))) return { error: "Staff member not found." };

  const supa = db();
  await supa
    .from("staff")
    .update({ archived: true, active: false })
    .eq("id", staffId)
    .eq("org_id", s.orgId);

  await logAudit({ orgId: s.orgId, actor: s.memberName, action: "staff.archived", entity: `staff:${staffId}` });

  revalidatePath("/staff");
  return {};
}

export async function toggleStaffActive(staffId: string, active: boolean) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };
  if (!(await staffInOrg(staffId, s.orgId))) return { error: "Staff member not found." };

  const supa = db();
  await supa.from("staff").update({ active }).eq("id", staffId).eq("org_id", s.orgId);
  revalidatePath("/staff");
  return {};
}

export async function assignRoles(staffId: string, roleIds: string[]) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };
  if (!(await staffInOrg(staffId, s.orgId))) return { error: "Staff member not found." };
  if (!(await allRolesInOrg(roleIds, s.orgId))) return { error: "Invalid role selection." };

  const supa = db();
  await supa.from("staff_role").delete().eq("staff_id", staffId);
  if (roleIds.length > 0) {
    await supa
      .from("staff_role")
      .insert(roleIds.map((role_id) => ({ staff_id: staffId, role_id })));
  }
  revalidatePath("/staff");
  return {};
}

export async function importStaffBulk(
  rows: { name: string; email: string | null; mobile: string | null; notes: string | null }[],
) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };
  const orgId = s.orgId;

  // Filter blank-name rows first so they don't count against the plan limit.
  const toInsert = rows
    .filter((r) => r.name.trim().length > 0)
    .map((r) => ({
      org_id: orgId,
      name: r.name.trim(),
      email: r.email?.trim() || null,
      mobile: r.mobile?.trim() || null,
      notes: r.notes?.trim() || null,
    }));

  if (toInsert.length === 0) return { error: "No rows to import." };

  const limit = await checkPlanLimit(orgId, "staff");
  if (limit.current + toInsert.length > limit.max) {
    return {
      error: `Your ${limit.plan} plan allows max ${limit.max} active staff. You have ${limit.current} and are trying to add ${toInsert.length}. Upgrade to add more.`,
    };
  }

  const supa = db();
  const { data, error } = await supa.from("staff").insert(toInsert).select("id");

  if (error) return { error: error.message };

  await logAudit({ orgId, actor: s.memberName, action: "staff.bulk_imported", meta: { count: data.length } });

  revalidatePath("/staff");
  return { imported: data.length };
}

export async function assignAreas(staffId: string, areaIds: string[]) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };
  if (!(await staffInOrg(staffId, s.orgId))) return { error: "Staff member not found." };
  if (!(await allAreasInOrg(areaIds, s.orgId))) return { error: "Invalid area selection." };

  const supa = db();
  await supa.from("staff_area").delete().eq("staff_id", staffId);
  if (areaIds.length > 0) {
    await supa
      .from("staff_area")
      .insert(areaIds.map((area_id) => ({ staff_id: staffId, area_id })));
  }
  revalidatePath("/staff");
  return {};
}
