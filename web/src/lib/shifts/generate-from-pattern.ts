import "server-only";
import { db } from "@/lib/db/server";

type HorizonOrg = {
  generation_horizon_unit: string;
  generation_horizon_value: number;
};

export function computeHorizonDate(org: HorizonOrg): Date {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (org.generation_horizon_unit === "months") {
    const months = Math.min(org.generation_horizon_value, 12);
    d.setMonth(d.getMonth() + months);
  } else {
    const days = Math.min(org.generation_horizon_value, 365);
    d.setDate(d.getDate() + days);
  }
  return d;
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function jsDayToWeekday(jsDay: number): number {
  // JS: 0=Sun..6=Sat → DB: 0=Mon..6=Sun
  return jsDay === 0 ? 6 : jsDay - 1;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

const BATCH_SIZE = 500;

export async function materializePattern(
  patternId: string,
  horizonDate: Date,
): Promise<{ created: number }> {
  const supa = db();

  const { data: pattern } = await supa
    .from("shift_pattern")
    .select("*")
    .eq("id", patternId)
    .single();

  if (!pattern || !pattern.active) return { created: 0 };

  const today = new Date();
  const todayStr = toISO(today);

  let fromDate = new Date(pattern.start_date);
  if (pattern.last_generated_to) {
    const watermark = addDays(new Date(pattern.last_generated_to), 1);
    if (watermark > fromDate) fromDate = watermark;
  }
  if (today > fromDate) fromDate = today;

  let toDate = horizonDate;
  if (pattern.end_date) {
    const endDate = new Date(pattern.end_date);
    if (endDate < toDate) toDate = endDate;
  }

  if (fromDate > toDate) {
    await supa
      .from("shift_pattern")
      .update({ last_generated_to: toISO(toDate), updated_at: new Date().toISOString() })
      .eq("id", patternId);
    return { created: 0 };
  }

  // Load blocked dates for the site in the window
  const { data: blocked } = await supa
    .from("site_blocked_date")
    .select("date")
    .eq("site_id", pattern.site_id)
    .gte("date", toISO(fromDate))
    .lte("date", toISO(toDate));

  const blockedSet = new Set((blocked ?? []).map((b) => b.date));

  const weekdaySet = new Set(pattern.weekdays as number[]);
  const rows: Array<{
    site_id: string;
    date: string;
    start_time: string;
    end_time: string;
    role_id: string;
    area_id: string | null;
    notes: string | null;
    source: string;
    status: string;
    pattern_id: string;
  }> = [];

  let cursor = new Date(fromDate);
  while (cursor <= toDate) {
    const iso = toISO(cursor);
    const wd = jsDayToWeekday(cursor.getDay());

    if (weekdaySet.has(wd) && !blockedSet.has(iso)) {
      for (let i = 0; i < pattern.min_staff; i++) {
        rows.push({
          site_id: pattern.site_id,
          date: iso,
          start_time: pattern.start_time,
          end_time: pattern.end_time,
          role_id: pattern.role_id,
          area_id: pattern.area_id,
          notes: pattern.notes,
          source: "pattern",
          status: "open",
          pattern_id: pattern.id,
        });
      }
    }

    cursor = addDays(cursor, 1);
  }

  // Batch insert
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supa.from("shift").insert(batch);
    if (!error) inserted += batch.length;
  }

  await supa
    .from("shift_pattern")
    .update({ last_generated_to: toISO(toDate), updated_at: new Date().toISOString() })
    .eq("id", patternId);

  return { created: inserted };
}

export async function regeneratePatternShifts(
  patternId: string,
  horizonDate: Date,
): Promise<{ deleted: number; created: number }> {
  const supa = db();
  const todayStr = toISO(new Date());

  // Delete future open shifts for this pattern
  const { data: deleted } = await supa
    .from("shift")
    .delete()
    .eq("pattern_id", patternId)
    .eq("status", "open")
    .gt("date", todayStr)
    .select("id");

  // Reset watermark so materialize starts from today
  await supa
    .from("shift_pattern")
    .update({ last_generated_to: null, updated_at: new Date().toISOString() })
    .eq("id", patternId);

  const { created } = await materializePattern(patternId, horizonDate);

  return { deleted: deleted?.length ?? 0, created };
}
