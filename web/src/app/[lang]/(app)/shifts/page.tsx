import { getLocale, getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/server";
import { ShiftsList } from "./shifts-list";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("shifts");
  return { title: `${t("title")} · Penshyft` };
}

export default async function ShiftsPage() {
  const locale = await getLocale();
  const session = await requireSession(locale);

  const supa = db();
  const today = new Date().toISOString().slice(0, 10);

  const { data: shifts } = await supa
    .from("shift")
    .select(
      "id, date, start_time, end_time, status, notes, source, area_id, role_id, filled_by, site_id, role:role_id (name, colour), area:area_id (name), assignee:filled_by (name)",
    )
    .eq("site_id", session.siteId)
    .gte("date", today)
    .order("date")
    .order("start_time");

  const { data: roles } = await supa
    .from("role")
    .select("id, name, colour")
    .eq("org_id", session.orgId)
    .eq("archived", false)
    .order("name");

  const { data: areas } = await supa
    .from("area")
    .select("id, name")
    .eq("site_id", session.siteId)
    .eq("archived", false)
    .order("name");

  const { data: staffList } = await supa
    .from("staff")
    .select("id, name")
    .eq("org_id", session.orgId)
    .eq("active", true)
    .eq("archived", false)
    .order("name");

  // Load offer counts per shift
  const shiftIds = (shifts ?? []).map((s) => s.id);
  let offersByShift = new Map<string, { total: number; pending: number; accepted: number; declined: number }>();

  if (shiftIds.length > 0) {
    const { data: offers } = await supa
      .from("shift_offer")
      .select("shift_id, outcome")
      .in("shift_id", shiftIds);

    for (const o of offers ?? []) {
      const entry = offersByShift.get(o.shift_id) ?? { total: 0, pending: 0, accepted: 0, declined: 0 };
      entry.total++;
      if (!o.outcome) entry.pending++;
      else if (o.outcome === "accepted") entry.accepted++;
      else if (o.outcome === "declined") entry.declined++;
      offersByShift.set(o.shift_id, entry);
    }
  }

  const enriched = (shifts ?? []).map((row) => {
    const role = Array.isArray(row.role) ? row.role[0] : row.role;
    const area = Array.isArray(row.area) ? row.area[0] : row.area;
    const assignee = Array.isArray(row.assignee) ? row.assignee[0] : row.assignee;
    const offers = offersByShift.get(row.id) ?? { total: 0, pending: 0, accepted: 0, declined: 0 };
    return {
      id: row.id,
      date: row.date,
      startTime: row.start_time,
      endTime: row.end_time,
      status: row.status as "open" | "filled" | "cancelled",
      notes: row.notes,
      roleId: row.role_id,
      roleName: role?.name ?? "—",
      roleColour: role?.colour ?? null,
      areaId: row.area_id,
      areaName: area?.name ?? null,
      filledBy: row.filled_by,
      assigneeName: assignee?.name ?? null,
      offerCount: offers.total,
      offerPending: offers.pending,
      offerAccepted: offers.accepted,
      offerDeclined: offers.declined,
    };
  });

  return (
    <ShiftsList
      shifts={enriched}
      roles={roles ?? []}
      areas={areas ?? []}
      staff={staffList ?? []}
      siteId={session.siteId}
      areaLabel={session.orgAreaLabel}
    />
  );
}
