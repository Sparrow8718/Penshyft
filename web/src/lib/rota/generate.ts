"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/server";
import { logAudit } from "@/lib/db/audit";
import { getSession } from "@/lib/auth/session";
import { siteInOrg } from "@/lib/auth/guards";

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function toIso(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getMonday(date: Date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function shiftDurationHours(start: string, end: string) {
  let mins = toMinutes(end) - toMinutes(start);
  if (mins <= 0) mins += 1440;
  return mins / 60;
}

function rangeOverlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  const as = toMinutes(aStart);
  const ae = toMinutes(aEnd) <= as ? toMinutes(aEnd) + 1440 : toMinutes(aEnd);
  const bs = toMinutes(bStart);
  const be = toMinutes(bEnd) <= bs ? toMinutes(bEnd) + 1440 : toMinutes(bEnd);
  return as < be && bs < ae;
}

export async function generateRota(siteId: string, weekStartStr?: string) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };
  if (!(await siteInOrg(siteId, s.orgId))) return { error: "Site not found." };
  const memberId = s.memberId;

  const supa = db();

  const weekStart = weekStartStr ? new Date(`${weekStartStr}T00:00:00Z`) : getMonday(new Date());
  const weekStartIso = toIso(weekStart);
  const weekEnd = toIso(addDays(weekStart, 6));

  const { data: templates } = await supa
    .from("shift_template")
    .select("weekday, start_time, end_time, min_staff, max_staff, role_id, area_id")
    .eq("site_id", siteId)
    .eq("active", true);

  if (!templates || templates.length === 0) {
    return { error: "No active shift templates found. Add templates in Settings first." };
  }

  // Load blocked dates for this site/week
  const { data: blockedRows } = await supa
    .from("site_blocked_date")
    .select("date")
    .eq("site_id", siteId)
    .gte("date", weekStartIso)
    .lte("date", weekEnd);

  const blockedDates = new Set((blockedRows ?? []).map((r) => r.date));

  // Delete existing rota-generated shifts for this week
  await supa
    .from("shift")
    .delete()
    .eq("site_id", siteId)
    .eq("source", "rota")
    .gte("date", weekStartIso)
    .lte("date", weekEnd);

  const { data: run, error: runErr } = await supa
    .from("rota_run")
    .insert({ site_id: siteId, week_start: weekStartIso, generated_by: memberId })
    .select("id")
    .single();

  if (runErr) return { error: runErr.message };

  const shifts: {
    site_id: string;
    role_id: string;
    area_id: string | null;
    date: string;
    start_time: string;
    end_time: string;
    source: string;
    status: string;
    rota_run_id: string;
  }[] = [];

  for (const tmpl of templates) {
    const shiftDate = toIso(addDays(weekStart, tmpl.weekday));
    if (blockedDates.has(shiftDate)) continue;

    for (let i = 0; i < tmpl.min_staff; i++) {
      shifts.push({
        site_id: siteId,
        role_id: tmpl.role_id,
        area_id: tmpl.area_id,
        date: shiftDate,
        start_time: tmpl.start_time,
        end_time: tmpl.end_time,
        source: "rota",
        status: "open",
        rota_run_id: run.id,
      });
    }
  }

  if (shifts.length > 0) {
    const { error: shiftErr } = await supa.from("shift").insert(shifts);
    if (shiftErr) return { error: shiftErr.message };
  }

  await autoAssign(siteId, weekStartIso, weekEnd);

  await logAudit({ orgId: s.orgId, actor: s.memberName, action: "rota.generated", meta: { shiftCount: shifts.length, weekStart: weekStartIso } });

  revalidatePath("/rota");
  revalidatePath("/shifts");
  revalidatePath("/dashboard");
  return { success: true, shiftCount: shifts.length };
}

export async function cloneWeek(siteId: string, sourceWeekStart: string, targetWeekStart: string) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };
  if (!(await siteInOrg(siteId, s.orgId))) return { error: "Site not found." };

  const supa = db();
  const sourceEnd = toIso(addDays(new Date(`${sourceWeekStart}T00:00:00Z`), 6));
  const targetStart = new Date(`${targetWeekStart}T00:00:00Z`);
  const sourceStart = new Date(`${sourceWeekStart}T00:00:00Z`);
  const dayOffset = Math.round((targetStart.getTime() - sourceStart.getTime()) / 86400000);

  // Load blocked dates for target week
  const targetEnd = toIso(addDays(targetStart, 6));
  const { data: blockedRows } = await supa
    .from("site_blocked_date")
    .select("date")
    .eq("site_id", siteId)
    .gte("date", targetWeekStart)
    .lte("date", targetEnd);
  const blockedDates = new Set((blockedRows ?? []).map((r) => r.date));

  const { data: sourceShifts } = await supa
    .from("shift")
    .select("role_id, area_id, date, start_time, end_time, notes")
    .eq("site_id", siteId)
    .neq("status", "cancelled")
    .gte("date", sourceWeekStart)
    .lte("date", sourceEnd);

  if (!sourceShifts || sourceShifts.length === 0) {
    return { error: "No shifts to clone in the source week." };
  }

  const newShifts = sourceShifts
    .map((sh) => {
      const srcDate = new Date(`${sh.date}T00:00:00Z`);
      const newDate = toIso(addDays(srcDate, dayOffset));
      return { newDate, sh };
    })
    .filter(({ newDate }) => !blockedDates.has(newDate))
    .map(({ newDate, sh }) => ({
      site_id: siteId,
      role_id: sh.role_id,
      area_id: sh.area_id,
      date: newDate,
      start_time: sh.start_time,
      end_time: sh.end_time,
      notes: sh.notes,
      source: "cloned" as const,
      status: "open" as const,
    }));

  if (newShifts.length === 0) {
    return { error: "All target dates are blocked." };
  }

  const { error } = await supa.from("shift").insert(newShifts);
  if (error) return { error: error.message };

  await logAudit({ orgId: s.orgId, actor: s.memberName, action: "rota.cloned", meta: { from: sourceWeekStart, to: targetWeekStart, count: newShifts.length } });

  revalidatePath("/rota");
  revalidatePath("/shifts");
  return { success: true, clonedCount: newShifts.length };
}

async function autoAssign(siteId: string, weekStart: string, weekEnd: string) {
  const supa = db();

  const { data: openShifts } = await supa
    .from("shift")
    .select("id, role_id, area_id, date, start_time, end_time")
    .eq("site_id", siteId)
    .eq("status", "open")
    .gte("date", weekStart)
    .lte("date", weekEnd)
    .order("date")
    .order("start_time");

  if (!openShifts || openShifts.length === 0) return;

  const { data: site } = await supa.from("site").select("org_id").eq("id", siteId).single();
  if (!site) return;

  const { data: staffRows } = await supa
    .from("staff")
    .select("id, max_hours_per_week, max_hours_per_day, max_days_per_week")
    .eq("org_id", site.org_id)
    .eq("active", true)
    .eq("archived", false);

  if (!staffRows || staffRows.length === 0) return;

  const staffIds = staffRows.map((s) => s.id);
  const staffConstraints = new Map(staffRows.map((s) => [s.id, {
    maxHoursWeek: s.max_hours_per_week ? Number(s.max_hours_per_week) : null,
    maxHoursDay: s.max_hours_per_day ? Number(s.max_hours_per_day) : null,
    maxDaysWeek: s.max_days_per_week,
  }]));

  const { data: staffRoles } = await supa.from("staff_role").select("staff_id, role_id").in("staff_id", staffIds);
  const { data: staffAreas } = await supa.from("staff_area").select("staff_id, area_id").in("staff_id", staffIds);

  const { data: availRows } = await supa
    .from("staff_availability")
    .select("staff_id, date, available")
    .in("staff_id", staffIds)
    .gte("date", weekStart)
    .lte("date", weekEnd)
    .eq("available", false);

  const unavailableDates = new Map<string, Set<string>>();
  for (const row of availRows ?? []) {
    if (!unavailableDates.has(row.staff_id)) unavailableDates.set(row.staff_id, new Set());
    unavailableDates.get(row.staff_id)!.add(row.date);
  }

  const rolesByStaff = new Map<string, Set<string>>();
  for (const sr of staffRoles ?? []) {
    if (!rolesByStaff.has(sr.staff_id)) rolesByStaff.set(sr.staff_id, new Set());
    rolesByStaff.get(sr.staff_id)!.add(sr.role_id);
  }

  const areasByStaff = new Map<string, Set<string>>();
  for (const sa of staffAreas ?? []) {
    if (!areasByStaff.has(sa.staff_id)) areasByStaff.set(sa.staff_id, new Set());
    areasByStaff.get(sa.staff_id)!.add(sa.area_id);
  }

  const assignmentsPerDay = new Map<string, number>();
  const totalAssignments = new Map<string, number>();
  const hoursPerDay = new Map<string, number>();
  const hoursPerWeek = new Map<string, number>();
  const daysWorked = new Map<string, Set<string>>();
  const assignedShifts = new Map<string, { date: string; start: string; end: string }[]>();

  function getKey(staffId: string, date: string) {
    return `${staffId}:${date}`;
  }

  function isAvailable(staffId: string, date: string, start: string, end: string) {
    if (unavailableDates.get(staffId)?.has(date)) return false;
    const existing = assignedShifts.get(staffId) ?? [];
    return !existing.some(
      (s) => s.date === date && rangeOverlaps(s.start, s.end, start, end),
    );
  }

  function canCover(staffId: string, roleId: string, areaId: string | null) {
    const roles = rolesByStaff.get(staffId);
    if (!roles || !roles.has(roleId)) return false;
    if (areaId) {
      const areas = areasByStaff.get(staffId);
      if (!areas || !areas.has(areaId)) return false;
    }
    return true;
  }

  function meetsConstraints(staffId: string, date: string, start: string, end: string) {
    const constraints = staffConstraints.get(staffId);
    if (!constraints) return true;
    const duration = shiftDurationHours(start, end);

    if (constraints.maxHoursDay !== null) {
      const dayHours = hoursPerDay.get(getKey(staffId, date)) ?? 0;
      if (dayHours + duration > constraints.maxHoursDay) return false;
    }

    if (constraints.maxHoursWeek !== null) {
      const weekHours = hoursPerWeek.get(staffId) ?? 0;
      if (weekHours + duration > constraints.maxHoursWeek) return false;
    }

    if (constraints.maxDaysWeek !== null) {
      const days = daysWorked.get(staffId) ?? new Set();
      if (!days.has(date) && days.size >= constraints.maxDaysWeek) return false;
    }

    return true;
  }

  for (const shift of openShifts) {
    const eligible = staffIds.filter(
      (id) =>
        canCover(id, shift.role_id, shift.area_id) &&
        isAvailable(id, shift.date, shift.start_time, shift.end_time) &&
        meetsConstraints(id, shift.date, shift.start_time, shift.end_time),
    );

    if (eligible.length === 0) continue;

    eligible.sort((a, b) => {
      const totalA = totalAssignments.get(a) ?? 0;
      const totalB = totalAssignments.get(b) ?? 0;
      if (totalA !== totalB) return totalA - totalB;
      const dayA = assignmentsPerDay.get(getKey(a, shift.date)) ?? 0;
      const dayB = assignmentsPerDay.get(getKey(b, shift.date)) ?? 0;
      return dayA - dayB;
    });

    const chosen = eligible[0];
    const duration = shiftDurationHours(shift.start_time, shift.end_time);

    await supa
      .from("shift")
      .update({
        filled_by: chosen,
        status: "filled",
        filled_at: new Date().toISOString(),
      })
      .eq("id", shift.id);

    const dayKey = getKey(chosen, shift.date);
    assignmentsPerDay.set(dayKey, (assignmentsPerDay.get(dayKey) ?? 0) + 1);
    totalAssignments.set(chosen, (totalAssignments.get(chosen) ?? 0) + 1);
    hoursPerDay.set(dayKey, (hoursPerDay.get(dayKey) ?? 0) + duration);
    hoursPerWeek.set(chosen, (hoursPerWeek.get(chosen) ?? 0) + duration);

    if (!daysWorked.has(chosen)) daysWorked.set(chosen, new Set());
    daysWorked.get(chosen)!.add(shift.date);

    if (!assignedShifts.has(chosen)) assignedShifts.set(chosen, []);
    assignedShifts.get(chosen)!.push({
      date: shift.date,
      start: shift.start_time,
      end: shift.end_time,
    });
  }
}
