import "server-only";
import { db } from "./server";

export type ShiftReportRow = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  roleName: string;
  areaName: string | null;
  staffName: string | null;
};

export type StaffHoursRow = {
  staffId: string;
  staffName: string;
  shiftCount: number;
  totalHours: number;
};

export type OfferMetrics = {
  totalOffers: number;
  accepted: number;
  declined: number;
  pending: number;
  avgResponseMinutes: number | null;
};

function hoursFromTimes(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  return diff / 60;
}

export async function getShiftReport(
  siteId: string,
  from: string,
  to: string,
): Promise<ShiftReportRow[]> {
  const supa = db();
  const { data } = await supa
    .from("shift")
    .select(
      "id, date, start_time, end_time, status, role:role_id (name), area:area_id (name), assignee:filled_by (name)",
    )
    .eq("site_id", siteId)
    .gte("date", from)
    .lte("date", to)
    .order("date")
    .order("start_time");

  return (data ?? []).map((s) => {
    const role = Array.isArray(s.role) ? s.role[0] : s.role;
    const area = Array.isArray(s.area) ? s.area[0] : s.area;
    const assignee = Array.isArray(s.assignee) ? s.assignee[0] : s.assignee;
    return {
      id: s.id,
      date: s.date,
      startTime: s.start_time,
      endTime: s.end_time,
      status: s.status,
      roleName: role?.name ?? "—",
      areaName: area?.name ?? null,
      staffName: assignee?.name ?? null,
    };
  });
}

export async function getStaffHoursReport(
  siteId: string,
  from: string,
  to: string,
): Promise<StaffHoursRow[]> {
  const supa = db();
  const { data } = await supa
    .from("shift")
    .select("filled_by, start_time, end_time, assignee:filled_by (name)")
    .eq("site_id", siteId)
    .eq("status", "filled")
    .gte("date", from)
    .lte("date", to)
    .not("filled_by", "is", null);

  const map = new Map<string, { name: string; count: number; hours: number }>();
  for (const s of data ?? []) {
    if (!s.filled_by) continue;
    const assignee = Array.isArray(s.assignee) ? s.assignee[0] : s.assignee;
    const entry = map.get(s.filled_by) ?? { name: assignee?.name ?? "—", count: 0, hours: 0 };
    entry.count++;
    entry.hours += hoursFromTimes(s.start_time, s.end_time);
    map.set(s.filled_by, entry);
  }

  return Array.from(map.entries())
    .map(([id, v]) => ({
      staffId: id,
      staffName: v.name,
      shiftCount: v.count,
      totalHours: Math.round(v.hours * 10) / 10,
    }))
    .sort((a, b) => b.totalHours - a.totalHours);
}

export async function getOfferMetrics(
  siteId: string,
  from: string,
  to: string,
): Promise<OfferMetrics> {
  const supa = db();

  const { data: shifts } = await supa
    .from("shift")
    .select("id")
    .eq("site_id", siteId)
    .gte("date", from)
    .lte("date", to);

  const shiftIds = (shifts ?? []).map((s) => s.id);

  if (shiftIds.length === 0) {
    return { totalOffers: 0, accepted: 0, declined: 0, pending: 0, avgResponseMinutes: null };
  }

  const { data: offers } = await supa
    .from("shift_offer")
    .select("id, outcome, sent_at, responded_at")
    .in("shift_id", shiftIds);

  const rows = offers ?? [];
  const accepted = rows.filter((o) => o.outcome === "accepted").length;
  const declined = rows.filter((o) => o.outcome === "declined").length;
  const pending = rows.filter((o) => o.outcome === null).length;

  const responseTimes = rows
    .filter((o) => o.responded_at)
    .map((o) => {
      const sent = new Date(o.sent_at).getTime();
      const responded = new Date(o.responded_at!).getTime();
      return (responded - sent) / 60000;
    });

  const avgResponseMinutes =
    responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : null;

  return { totalOffers: rows.length, accepted, declined, pending, avgResponseMinutes };
}
