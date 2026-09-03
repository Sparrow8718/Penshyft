"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/server";
import { logAudit } from "@/lib/db/audit";
import { getSession } from "@/lib/auth/session";
import { checkPlanLimit } from "@/lib/billing/plans";

export async function createStaff(formData: FormData) {
  const orgId = formData.get("orgId") as string;
  const name = (formData.get("name") as string).trim();
  const email = (formData.get("email") as string)?.trim() || null;
  const mobile = (formData.get("mobile") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!name) return { error: "Name is required." };

  const limit = await checkPlanLimit(orgId, "staff");
  if (!limit.allowed) {
    return { error: `Your ${limit.plan} plan allows max ${limit.max} active staff (currently ${limit.current}). Upgrade to add more.` };
  }

  const supa = db();
  const { data, error } = await supa
    .from("staff")
    .insert({ org_id: orgId, name, email, mobile, notes })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const s = await getSession();
  if (s) logAudit({ orgId: s.orgId, actor: s.memberName, action: "staff.created", entity: `staff:${data.id}`, meta: { name } });

  revalidatePath("/staff");
  return { staffId: data.id };
}

export async function updateStaff(formData: FormData) {
  const staffId = formData.get("staffId") as string;
  const name = (formData.get("name") as string).trim();
  const email = (formData.get("email") as string)?.trim() || null;
  const mobile = (formData.get("mobile") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!name) return { error: "Name is required." };

  const supa = db();
  const { error } = await supa
    .from("staff")
    .update({ name, email, mobile, notes })
    .eq("id", staffId);

  if (error) return { error: error.message };

  const s = await getSession();
  if (s) logAudit({ orgId: s.orgId, actor: s.memberName, action: "staff.updated", entity: `staff:${staffId}` });

  revalidatePath("/staff");
  return {};
}

export async function archiveStaff(staffId: string) {
  const supa = db();
  await supa
    .from("staff")
    .update({ archived: true, active: false })
    .eq("id", staffId);

  const s = await getSession();
  if (s) logAudit({ orgId: s.orgId, actor: s.memberName, action: "staff.archived", entity: `staff:${staffId}` });

  revalidatePath("/staff");
}

export async function toggleStaffActive(staffId: string, active: boolean) {
  const supa = db();
  await supa.from("staff").update({ active }).eq("id", staffId);
  revalidatePath("/staff");
}

export async function assignRoles(staffId: string, roleIds: string[]) {
  const supa = db();
  await supa.from("staff_role").delete().eq("staff_id", staffId);
  if (roleIds.length > 0) {
    await supa
      .from("staff_role")
      .insert(roleIds.map((role_id) => ({ staff_id: staffId, role_id })));
  }
  revalidatePath("/staff");
}

export async function importStaffBulk(
  orgId: string,
  rows: { name: string; email: string | null; mobile: string | null; notes: string | null }[],
) {
  if (rows.length === 0) return { error: "No rows to import." };

  const limit = await checkPlanLimit(orgId, "staff");
  if (limit.current + rows.length > limit.max) {
    return {
      error: `Your ${limit.plan} plan allows max ${limit.max} active staff. You have ${limit.current} and are trying to add ${rows.length}. Upgrade to add more.`,
    };
  }

  const supa = db();

  const toInsert = rows
    .filter((r) => r.name.trim().length > 0)
    .map((r) => ({
      org_id: orgId,
      name: r.name.trim(),
      email: r.email?.trim() || null,
      mobile: r.mobile?.trim() || null,
      notes: r.notes?.trim() || null,
    }));

  const { data, error } = await supa.from("staff").insert(toInsert).select("id");

  if (error) return { error: error.message };

  const s = await getSession();
  if (s) logAudit({ orgId: s.orgId, actor: s.memberName, action: "staff.bulk_imported", meta: { count: data.length } });

  revalidatePath("/staff");
  return { imported: data.length };
}

export async function assignAreas(staffId: string, areaIds: string[]) {
  const supa = db();
  await supa.from("staff_area").delete().eq("staff_id", staffId);
  if (areaIds.length > 0) {
    await supa
      .from("staff_area")
      .insert(areaIds.map((area_id) => ({ staff_id: staffId, area_id })));
  }
  revalidatePath("/staff");
}
