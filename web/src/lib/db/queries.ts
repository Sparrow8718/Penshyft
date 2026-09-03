import "server-only";
import { db } from "./server";

export type CoverageCell = {
  roleId: string;
  role: string;
  colour: string | null;
  needed: number;
  filled: number;
};

export type TodayShift = {
  id: string;
  role: string;
  colour: string | null;
  time: string;
  status: "filled" | "open" | "at_risk";
  who: string | null;
};

const iso = (d: Date) => d.toISOString().slice(0, 10);
const jsWeekdayToPgMon0 = (d: Date) => {
  return (d.getDay() + 6) % 7;
};

export async function getTodayShifts(siteId: string): Promise<TodayShift[]> {
  const today = iso(new Date());
  const supa = db();
  const { data, error } = await supa
    .from("shift")
    .select("id, date, start_time, end_time, status, filled_by, role:role_id (name, colour), assignee:filled_by (name)")
    .eq("site_id", siteId)
    .eq("date", today)
    .order("start_time");
  if (error) throw error;

  const now = new Date();
  const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  return (data ?? []).map((row) => {
    const role = Array.isArray(row.role) ? row.role[0] : row.role;
    const assignee = Array.isArray(row.assignee) ? row.assignee[0] : row.assignee;

    let status: TodayShift["status"] = row.status === "filled" ? "filled" : "open";
    if (status === "open") {
      const start = new Date(`${row.date}T${row.start_time}`);
      if (start <= inTwoHours) status = "at_risk";
    }

    return {
      id: row.id,
      role: role?.name ?? "—",
      colour: role?.colour ?? null,
      time: `${row.start_time.slice(0, 5)}–${row.end_time.slice(0, 5)}`,
      status,
      who: assignee?.name ?? null,
    };
  });
}

export async function getCoverageForToday(siteId: string): Promise<CoverageCell[]> {
  const today = new Date();
  const weekday = jsWeekdayToPgMon0(today);
  const supa = db();

  const { data: reqs, error: reqErr } = await supa
    .from("coverage_requirement")
    .select("role_id, min_count, role:role_id (name, colour)")
    .eq("site_id", siteId)
    .eq("weekday", weekday);
  if (reqErr) throw reqErr;

  const { data: shifts, error: shErr } = await supa
    .from("shift")
    .select("role_id, status")
    .eq("site_id", siteId)
    .eq("date", iso(today));
  if (shErr) throw shErr;

  const filledByRole = new Map<string, number>();
  for (const s of shifts ?? []) {
    if (s.status === "filled") {
      filledByRole.set(s.role_id, (filledByRole.get(s.role_id) ?? 0) + 1);
    }
  }

  return (reqs ?? []).map((r) => {
    const role = Array.isArray(r.role) ? r.role[0] : r.role;
    return {
      roleId: r.role_id,
      role: role?.name ?? "—",
      colour: role?.colour ?? null,
      needed: r.min_count,
      filled: filledByRole.get(r.role_id) ?? 0,
    };
  });
}

export type WeeklyStats = {
  totalShifts: number;
  openShifts: number;
  filledShifts: number;
  offersSent: number;
  offersResponded: number;
};

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

export async function getWeeklyStats(siteId: string): Promise<WeeklyStats> {
  const now = new Date();
  const monday = getMonday(now);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const mondayIso = iso(monday);
  const sundayIso = iso(sunday);

  const supa = db();

  const { data: shifts } = await supa
    .from("shift")
    .select("id, status")
    .eq("site_id", siteId)
    .gte("date", mondayIso)
    .lte("date", sundayIso);

  const shiftRows = shifts ?? [];
  const shiftIds = shiftRows.map((s) => s.id);

  let offersSent = 0;
  let offersResponded = 0;

  if (shiftIds.length > 0) {
    const { data: offers } = await supa
      .from("shift_offer")
      .select("id, outcome")
      .in("shift_id", shiftIds);

    offersSent = (offers ?? []).length;
    offersResponded = (offers ?? []).filter((o) => o.outcome !== null).length;
  }

  return {
    totalShifts: shiftRows.length,
    openShifts: shiftRows.filter((s) => s.status === "open").length,
    filledShifts: shiftRows.filter((s) => s.status === "filled").length,
    offersSent,
    offersResponded,
  };
}

export type StaffUtilRow = { staffId: string; staffName: string; shiftCount: number };

export async function getStaffUtilisation(siteId: string): Promise<StaffUtilRow[]> {
  const now = new Date();
  const monday = getMonday(now);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const supa = db();

  const { data: shifts } = await supa
    .from("shift")
    .select("filled_by, assignee:filled_by (name)")
    .eq("site_id", siteId)
    .eq("status", "filled")
    .gte("date", iso(monday))
    .lte("date", iso(sunday))
    .not("filled_by", "is", null);

  const countMap = new Map<string, { name: string; count: number }>();
  for (const s of shifts ?? []) {
    if (!s.filled_by) continue;
    const assignee = Array.isArray(s.assignee) ? s.assignee[0] : s.assignee;
    const entry = countMap.get(s.filled_by) ?? { name: assignee?.name ?? "—", count: 0 };
    entry.count++;
    countMap.set(s.filled_by, entry);
  }

  return Array.from(countMap.entries())
    .map(([id, v]) => ({ staffId: id, staffName: v.name, shiftCount: v.count }))
    .sort((a, b) => b.shiftCount - a.shiftCount)
    .slice(0, 10);
}

export async function getSiteName(siteId: string): Promise<string> {
  const supa = db();
  const { data } = await supa.from("site").select("name").eq("id", siteId).maybeSingle();
  return data?.name ?? "Site";
}
