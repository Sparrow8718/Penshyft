"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db/server";
import { logAudit } from "@/lib/db/audit";
import { getSession } from "@/lib/auth/session";
import { getNotificationProvider } from "@/lib/providers/notification";
import { shiftOfferEmail } from "@/lib/emails/templates";

function generateToken() {
  return randomBytes(24).toString("base64url");
}

export async function blastShift(shiftId: string) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };

  const supa = db();

  // Get shift details
  const { data: shift } = await supa
    .from("shift")
    .select("id, site_id, role_id, area_id, date, start_time, end_time, status, role:role_id (name), area:area_id (name)")
    .eq("id", shiftId)
    .single();

  if (!shift) return { error: "Shift not found." };
  if (shift.status !== "open") return { error: "Shift is not open." };

  // Get org_id from site and verify it belongs to the caller's org.
  const { data: site } = await supa
    .from("site")
    .select("org_id, name")
    .eq("id", shift.site_id)
    .single();
  if (!site) return { error: "Site not found." };
  if (site.org_id !== s.orgId) return { error: "Shift not found." };

  // Find qualified staff (matching role, optionally area)
  const { data: staffWithRole } = await supa
    .from("staff_role")
    .select("staff_id")
    .eq("role_id", shift.role_id);

  const qualifiedByRole = new Set((staffWithRole ?? []).map((sr) => sr.staff_id));

  let qualifiedByArea: Set<string> | null = null;
  if (shift.area_id) {
    const { data: staffWithArea } = await supa
      .from("staff_area")
      .select("staff_id")
      .eq("area_id", shift.area_id);
    qualifiedByArea = new Set((staffWithArea ?? []).map((sa) => sa.staff_id));
  }

  // Get active, non-archived staff in this org
  const { data: allStaff } = await supa
    .from("staff")
    .select("id, name, email")
    .eq("org_id", site.org_id)
    .eq("active", true)
    .eq("archived", false);

  const eligible = (allStaff ?? []).filter((s) => {
    if (!qualifiedByRole.has(s.id)) return false;
    if (qualifiedByArea && !qualifiedByArea.has(s.id)) return false;
    if (!s.email) return false;
    return true;
  });

  if (eligible.length === 0) {
    return { error: "No qualified staff with email addresses found." };
  }

  // Check for existing offers on this shift to avoid duplicates
  const { data: existingOffers } = await supa
    .from("shift_offer")
    .select("staff_id")
    .eq("shift_id", shiftId);

  const alreadySent = new Set((existingOffers ?? []).map((o) => o.staff_id));
  const toSend = eligible.filter((s) => !alreadySent.has(s.id));

  if (toSend.length === 0) {
    return { error: "All qualified staff have already been sent an offer." };
  }

  // Create offer rows and send notifications
  const role = Array.isArray(shift.role) ? shift.role[0] : shift.role;
  const area = Array.isArray(shift.area) ? shift.area[0] : shift.area;
  const roleName = role?.name ?? "Shift";
  const areaName = area?.name;
  const shiftLabel = `${roleName}${areaName ? ` (${areaName})` : ""} — ${shift.date} ${shift.start_time.slice(0, 5)}–${shift.end_time.slice(0, 5)}`;

  let sentCount = 0;
  const notifier = getNotificationProvider();

  for (const staff of toSend) {
    const token = generateToken();
    const offerUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/offer/${token}`;

    // Insert the offer row first so the emailed token is immediately valid.
    const { data: offerRow, error } = await supa
      .from("shift_offer")
      .insert({ shift_id: shiftId, staff_id: staff.id, token })
      .select("id")
      .single();
    if (error || !offerRow) continue;

    // Send; if it fails, roll the row back so this recipient isn't left with
    // a phantom "already sent" record blocking a later retry.
    let ok = false;
    try {
      const result = await notifier.sendEmail({
        to: staff.email!,
        subject: `Shift available: ${shiftLabel}`,
        body: shiftOfferEmail({
          staffName: staff.name,
          shiftLabel,
          siteName: site.name,
          offerUrl,
        }),
        orgId: site.org_id,
        meta: { shiftId, staffId: staff.id, token },
      });
      ok = result.ok;
    } catch {
      ok = false;
    }

    if (!ok) {
      await supa.from("shift_offer").delete().eq("id", offerRow.id);
      continue;
    }

    sentCount++;
  }

  await logAudit({ orgId: s.orgId, actor: s.memberName, action: "offers.blasted", entity: `shift:${shiftId}`, meta: { sentCount } });

  revalidatePath("/shifts");
  revalidatePath("/rota");
  return { success: true, sentCount };
}
