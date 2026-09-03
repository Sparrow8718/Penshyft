"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/server";
import { logAudit } from "@/lib/db/audit";

export async function addStaffOnboarding(formData: FormData) {
  const session = await requireSession("en");
  const name = (formData.get("name") as string)?.trim();
  const mobile = (formData.get("mobile") as string)?.trim() || null;

  if (!name) return { error: "Name is required." };

  const supa = db();
  const { error } = await supa.from("staff").insert({
    org_id: session.orgId,
    name,
    mobile,
  });

  if (error) return { error: error.message };

  logAudit({
    action: "staff_created",
    actor: session.memberId,
    orgId: session.orgId,
    entity: name,
  });

  revalidatePath("/onboarding");
  return { ok: true };
}

export async function createShiftOnboarding(formData: FormData) {
  const session = await requireSession("en");
  const date = formData.get("date") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;

  if (!date || !startTime || !endTime) return { error: "All fields are required." };

  const supa = db();

  const [{ data: area }, { data: role }] = await Promise.all([
    supa.from("area").select("id").eq("site_id", session.siteId).limit(1).single(),
    supa.from("role").select("id").eq("org_id", session.orgId).eq("archived", false).limit(1).single(),
  ]);

  if (!area) return { error: "No area found. Check your site settings." };
  if (!role) return { error: "No role found. Add a role in Settings first." };

  const { error } = await supa.from("shift").insert({
    site_id: session.siteId,
    area_id: area.id,
    role_id: role.id,
    date,
    start_time: startTime,
    end_time: endTime,
    status: "open",
  });

  if (error) return { error: error.message };

  logAudit({
    action: "shift_created",
    actor: session.memberId,
    orgId: session.orgId,
    entity: `${date} ${startTime}-${endTime}`,
  });

  revalidatePath("/onboarding");
  return { ok: true };
}

export async function completeOnboarding() {
  const session = await requireSession("en");
  const supa = db();

  await supa
    .from("org")
    .update({ onboarding_completed: true })
    .eq("id", session.orgId);

  revalidatePath("/");
  return { ok: true };
}
