"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/server";
import { verifyStaffToken } from "@/lib/auth/staff-token";
import { getNotificationProvider } from "@/lib/providers/notification";
import { swapRequestedEmail } from "@/lib/emails/templates";

export async function requestSwap(
  shiftId: string,
  staffToken: string,
  reason: string,
) {
  // Re-validate the staff token server-side; never trust a client-supplied
  // staffId. The staffId is derived from the signed token.
  const staffId = verifyStaffToken(staffToken);
  if (!staffId) return { error: "Invalid or expired link." };

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

  const { data: shift } = await supa
    .from("shift")
    .select("id, date, start_time, end_time, filled_by, site_id")
    .eq("id", shiftId)
    .single();

  if (!shift) return { error: "Shift not found." };
  if (shift.filled_by !== staffId) return { error: "You are not assigned to this shift." };

  const { error } = await supa.from("shift_swap").insert({
    shift_id: shiftId,
    requester_staff_id: staffId,
    reason: reason || null,
    token,
  });

  if (error) return { error: error.message };

  const { data: staff } = await supa
    .from("staff")
    .select("name")
    .eq("id", staffId)
    .single();

  const { data: site } = await supa
    .from("site")
    .select("org_id")
    .eq("id", shift.site_id)
    .single();

  if (site) {
    const { data: managers } = await supa
      .from("member")
      .select("email")
      .eq("org_id", site.org_id)
      .in("role", ["org_admin", "org_manager", "site_manager"])
      .eq("status", "active");

    if (managers && managers.length > 0) {
      const notifier = getNotificationProvider();
      const shiftLabel = `${shift.date} ${shift.start_time}–${shift.end_time}`;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

      for (const mgr of managers) {
        await notifier.sendEmail({
          to: mgr.email,
          subject: `Swap request from ${staff?.name ?? "a staff member"}`,
          body: swapRequestedEmail({
            staffName: staff?.name ?? "Staff member",
            shiftLabel,
            reason: reason || "No reason given",
            approvalUrl: `${appUrl}/en/swaps`,
          }),
          orgId: site.org_id,
        });
      }
    }
  }

  return {};
}
