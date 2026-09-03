"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/server";
import { logAudit } from "@/lib/db/audit";
import { getSession } from "@/lib/auth/session";
import { getNotificationProvider } from "@/lib/providers/notification";
import { swapResolvedEmail } from "@/lib/emails/templates";

export async function approveSwap(swapId: string, managerNote: string) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };

  const supa = db();

  const { data: swap } = await supa
    .from("shift_swap")
    .select("id, shift_id, requester_staff_id, status")
    .eq("id", swapId)
    .single();

  if (!swap) return { error: "Swap request not found." };
  if (swap.status !== "pending") return { error: "Swap is no longer pending." };

  const { data: shift } = await supa
    .from("shift")
    .select("id, site_id, date, start_time, end_time, status")
    .eq("id", swap.shift_id)
    .single();

  if (!shift) return { error: "Shift not found." };

  await supa
    .from("shift")
    .update({ status: "open", filled_by: null, filled_at: null })
    .eq("id", shift.id);

  await supa
    .from("shift_swap")
    .update({
      status: "approved",
      manager_note: managerNote || null,
      resolved_at: new Date().toISOString(),
      resolved_by: s.memberId,
    })
    .eq("id", swapId);

  const { data: staff } = await supa
    .from("staff")
    .select("id, name, email")
    .eq("id", swap.requester_staff_id)
    .single();

  if (staff?.email) {
    const notifier = getNotificationProvider();
    const shiftLabel = `${shift.date} ${shift.start_time}–${shift.end_time}`;
    await notifier.sendEmail({
      to: staff.email,
      subject: "Your swap request was approved",
      body: swapResolvedEmail({
        staffName: staff.name,
        shiftLabel,
        approved: true,
        managerNote: managerNote || undefined,
      }),
    });
  }

  logAudit({
    orgId: s.orgId,
    actor: s.memberName,
    action: "swap.approved",
    entity: `shift_swap:${swapId}`,
  });

  revalidatePath("/swaps");
  return {};
}

export async function denySwap(swapId: string, managerNote: string) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };

  const supa = db();

  const { data: swap } = await supa
    .from("shift_swap")
    .select("id, shift_id, requester_staff_id, status")
    .eq("id", swapId)
    .single();

  if (!swap) return { error: "Swap request not found." };
  if (swap.status !== "pending") return { error: "Swap is no longer pending." };

  await supa
    .from("shift_swap")
    .update({
      status: "denied",
      manager_note: managerNote || null,
      resolved_at: new Date().toISOString(),
      resolved_by: s.memberId,
    })
    .eq("id", swapId);

  const { data: shift } = await supa
    .from("shift")
    .select("date, start_time, end_time")
    .eq("id", swap.shift_id)
    .single();

  const { data: staff } = await supa
    .from("staff")
    .select("id, name, email")
    .eq("id", swap.requester_staff_id)
    .single();

  if (staff?.email && shift) {
    const notifier = getNotificationProvider();
    const shiftLabel = `${shift.date} ${shift.start_time}–${shift.end_time}`;
    await notifier.sendEmail({
      to: staff.email,
      subject: "Your swap request was denied",
      body: swapResolvedEmail({
        staffName: staff.name,
        shiftLabel,
        approved: false,
        managerNote: managerNote || undefined,
      }),
    });
  }

  logAudit({
    orgId: s.orgId,
    actor: s.memberName,
    action: "swap.denied",
    entity: `shift_swap:${swapId}`,
  });

  revalidatePath("/swaps");
  return {};
}

export async function createSwapRequest(
  shiftId: string,
  staffId: string,
  reason: string,
) {
  const supa = db();
  const token = randomBytes(24).toString("base64url");

  const { data: existing } = await supa
    .from("shift_swap")
    .select("id")
    .eq("shift_id", shiftId)
    .eq("requester_staff_id", staffId)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) return { error: "A swap request is already pending for this shift." };

  const { error } = await supa.from("shift_swap").insert({
    shift_id: shiftId,
    requester_staff_id: staffId,
    reason: reason || null,
    token,
  });

  if (error) return { error: error.message };

  revalidatePath("/swaps");
  return { token };
}
