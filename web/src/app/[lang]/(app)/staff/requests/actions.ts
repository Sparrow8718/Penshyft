"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/server";
import { getSession } from "@/lib/auth/session";

export async function approveRequest(requestId: string, note?: string) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };

  const supa = db();

  const { data: req } = await supa
    .from("availability_request")
    .select("id, org_id, request_type, date, staff_id")
    .eq("id", requestId)
    .eq("org_id", s.orgId)
    .eq("status", "pending")
    .single();

  if (!req) return { error: "Request not found." };

  const { error } = await supa
    .from("availability_request")
    .update({
      status: "approved",
      resolved_by: s.memberId,
      resolved_at: new Date().toISOString(),
      manager_note: note?.trim() || null,
    })
    .eq("id", requestId);

  if (error) return { error: error.message };

  if (req.request_type === "day_off" && req.date) {
    await supa.from("staff_availability").upsert(
      {
        staff_id: req.staff_id,
        date: req.date,
        available: false,
        notes: note?.trim() || null,
      },
      { onConflict: "staff_id,date" },
    );
  }

  revalidatePath("/staff/requests");
  return {};
}

export async function denyRequest(requestId: string, note?: string) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };

  const supa = db();

  const { data: req } = await supa
    .from("availability_request")
    .select("id")
    .eq("id", requestId)
    .eq("org_id", s.orgId)
    .eq("status", "pending")
    .single();

  if (!req) return { error: "Request not found." };

  const { error } = await supa
    .from("availability_request")
    .update({
      status: "denied",
      resolved_by: s.memberId,
      resolved_at: new Date().toISOString(),
      manager_note: note?.trim() || null,
    })
    .eq("id", requestId);

  if (error) return { error: error.message };

  revalidatePath("/staff/requests");
  return {};
}
