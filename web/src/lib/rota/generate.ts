"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/server";
import { logAudit } from "@/lib/db/audit";
import { getSession } from "@/lib/auth/session";

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toIso(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export async function generateRota(siteId: string, memberId: string, weekStartStr?: string) {
  const supa = db();

  const weekStart = weekStartStr ? new Date(weekStartStr) : getMonday(new Date());
  const weekStartIso = toIso(weekStart);

  const { data: templates } = await supa
    .from("shift_template")
    .select("weekday, start_time, end_time, headcount, role_id, area_id")
    .eq("site_id", siteId)
    .eq("active", true);

  if (!templates || templates.length === 0) {
    return { error: "No active shift templates found. Add templates in Settings first." };
  }

  // Delete existing rota-generated shifts for this week (allow regeneration)
  const weekEnd = toIso(addDays(weekStart, 6));
  await supa
    .from("shift")
    .delete()
    .eq("site_id", siteId)
    .eq("source", "rota")
    .gte("date", weekStartIso)
    .lte("date", weekEnd);

  // Create rota_run record
  const { data: run, error: runErr } = await supa
    .from("rota_run")
    .insert({ site_id: siteId, week_start: weekStartIso, generated_by: memberId })
    .select("id")
    .single();

  if (runErr) return { error: runErr.message };

  // Generate shifts from templates
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
    for (let i = 0; i < tmpl.headcount; i++) {
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

  const { error: shiftErr } = await supa.from("shift").insert(shifts);
  if (shiftErr) return { error: shiftErr.message };

  // Auto-assign staff based on role + area qualifications
  await autoAssign(siteId, weekStartIso, weekEnd);

  const s = await getSession();
  if (s) logAudit({ orgId: s.orgId, actor: s.memberName, action: "rota.generated", meta: { shiftCount: shifts.length, weekStart: weekStartIso } });

  revalidatePath("/rota");
  revalidatePath("/shifts");
  revalidatePath("/dashboard");
  return { success: true, shiftCount: shifts.length };
}

async function autoAssign(siteId: string, weekStart: string, weekEnd: string) {
  const supa = db();

  // Get open shifts for this week
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

  // Get org_id from site
  const { data: site } = await supa
    .from("site")
    .select("org_id")
    .eq("id", siteId)
    .single();
  if (!site) return;

  // Get active staff with their roles and areas
  const { data: staff } = await supa
    .from("staff")
    .select("id")
    .eq("org_id", site.org_id)
    .eq("active", true)
    .eq("archived", false);

  if (!staff || staff.length === 0) return;

  const staffIds = staff.map((s) => s.id);

  const { data: staffRoles } = await supa
    .from("staff_role")
    .select("staff_id, role_id")
    .in("staff_id", staffIds);

  const { data: staffAreas } = await supa
    .from("staff_area")
    .select("staff_id, area_id")
    .in("staff_id", staffIds);

  // Load availability flags for the week
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

  // Build lookup maps
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

  // Track assignments per staff per day for load balancing
  const assignmentsPerDay = new Map<string, number>(); // "staffId:date" -> count
  const totalAssignments = new Map<string, number>(); // staffId -> total

  function getKey(staffId: string, date: string) {
    return `${staffId}:${date}`;
  }

  // Check if a staff member is available (no overlapping shift on same date/time)
  const assignedShifts = new Map<string, { date: string; start: string; end: string }[]>();

  function isAvailable(staffId: string, date: string, start: string, end: string) {
    if (unavailableDates.get(staffId)?.has(date)) return false;
    const existing = assignedShifts.get(staffId) ?? [];
    return !existing.some(
      (s) => s.date === date && s.start < end && s.end > start,
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

  // Assign shifts, preferring staff with fewer assignments (load balancing)
  for (const shift of openShifts) {
    const eligible = staffIds.filter(
      (id) =>
        canCover(id, shift.role_id, shift.area_id) &&
        isAvailable(id, shift.date, shift.start_time, shift.end_time),
    );

    if (eligible.length === 0) continue;

    // Pick the person with fewest total assignments, then fewest on this day
    eligible.sort((a, b) => {
      const totalA = totalAssignments.get(a) ?? 0;
      const totalB = totalAssignments.get(b) ?? 0;
      if (totalA !== totalB) return totalA - totalB;
      const dayA = assignmentsPerDay.get(getKey(a, shift.date)) ?? 0;
      const dayB = assignmentsPerDay.get(getKey(b, shift.date)) ?? 0;
      return dayA - dayB;
    });

    const chosen = eligible[0];

    // Record the assignment
    await supa
      .from("shift")
      .update({
        filled_by: chosen,
        status: "filled",
        filled_at: new Date().toISOString(),
      })
      .eq("id", shift.id);

    // Update tracking
    const dayKey = getKey(chosen, shift.date);
    assignmentsPerDay.set(dayKey, (assignmentsPerDay.get(dayKey) ?? 0) + 1);
    totalAssignments.set(chosen, (totalAssignments.get(chosen) ?? 0) + 1);

    if (!assignedShifts.has(chosen)) assignedShifts.set(chosen, []);
    assignedShifts.get(chosen)!.push({
      date: shift.date,
      start: shift.start_time,
      end: shift.end_time,
    });
  }
}
