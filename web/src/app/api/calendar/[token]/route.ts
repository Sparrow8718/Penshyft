import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyStaffToken } from "@/lib/auth/staff-token";
import type { Database } from "@/lib/db/types";

function supaAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function escapeIcal(s: string): string {
  return s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
}

function formatIcalDate(date: string, time: string): string {
  return date.replace(/-/g, "") + "T" + time.replace(/:/g, "") + "00";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const staffId = verifyStaffToken(token);
  if (!staffId) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  const db = supaAdmin();

  const { data: staff } = await db
    .from("staff")
    .select("name, org_id")
    .eq("id", staffId)
    .single();

  if (!staff) {
    return NextResponse.json({ error: "Staff not found" }, { status: 404 });
  }

  const today = new Date().toISOString().slice(0, 10);

  const { data: shifts } = await db
    .from("shift")
    .select("id, date, start_time, end_time, role:role_id (name), area:area_id (name), site:site_id (name)")
    .eq("filled_by", staffId)
    .gte("date", today)
    .order("date")
    .order("start_time")
    .limit(200);

  const events = (shifts ?? []).map((s) => {
    const role = Array.isArray(s.role) ? s.role[0] : s.role;
    const area = Array.isArray(s.area) ? s.area[0] : s.area;
    const site = Array.isArray(s.site) ? s.site[0] : s.site;

    const summary = [role?.name, area?.name, site?.name]
      .filter(Boolean)
      .join(" · ");

    const dtStart = formatIcalDate(s.date, s.start_time);
    const dtEnd = formatIcalDate(s.date, s.end_time);

    return [
      "BEGIN:VEVENT",
      `UID:${s.id}@penshyft`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${escapeIcal(summary || "Shift")}`,
      `DESCRIPTION:${escapeIcal(`${staff.name} — ${s.date} ${s.start_time}–${s.end_time}`)}`,
      "END:VEVENT",
    ].join("\r\n");
  });

  const cal = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Penshyft//EN",
    `X-WR-CALNAME:${escapeIcal(`${staff.name} — Shifts`)}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(cal, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="shifts.ics"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
