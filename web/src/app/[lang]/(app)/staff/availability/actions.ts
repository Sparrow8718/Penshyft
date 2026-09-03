"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/server";
import { getSession } from "@/lib/auth/session";
import { staffInOrg } from "@/lib/auth/guards";

export async function toggleAvailability(
  staffId: string,
  date: string,
  available: boolean,
  notes?: string,
) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };
  if (!(await staffInOrg(staffId, s.orgId))) return { error: "Staff member not found." };

  const supa = db();

  await supa.from("staff_availability").upsert(
    {
      staff_id: staffId,
      date,
      available,
      notes: notes?.trim() || null,
    },
    { onConflict: "staff_id,date" },
  );

  revalidatePath("/staff/availability");
  return {};
}

export async function bulkSetAvailability(
  staffId: string,
  dates: string[],
  available: boolean,
) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };
  if (!(await staffInOrg(staffId, s.orgId))) return { error: "Staff member not found." };

  const supa = db();

  const rows = dates.map((date) => ({
    staff_id: staffId,
    date,
    available,
    notes: null,
  }));

  await supa.from("staff_availability").upsert(rows, { onConflict: "staff_id,date" });

  revalidatePath("/staff/availability");
  return {};
}
