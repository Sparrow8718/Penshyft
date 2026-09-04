import { getLocale, getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/server";
import { RotaView } from "./rota-view";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("rota");
  return { title: `${t("title")} · Penshyft` };
}

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toIso(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function RotaPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const locale = await getLocale();
  const session = await requireSession(locale);
  const params = await searchParams;

  const weekStart = params.week
    ? new Date(params.week)
    : getMonday(new Date());
  const weekStartIso = toIso(weekStart);
  const weekEndIso = toIso(addDays(weekStart, 6));

  const supa = db();

  const { data: shifts } = await supa
    .from("shift")
    .select(
      "id, date, start_time, end_time, status, role_id, area_id, filled_by, source, role:role_id (name, colour), area:area_id (name), assignee:filled_by (name)",
    )
    .eq("site_id", session.siteId)
    .gte("date", weekStartIso)
    .lte("date", weekEndIso)
    .order("date")
    .order("start_time");

  const { data: roles } = await supa
    .from("role")
    .select("id, name, colour")
    .eq("org_id", session.orgId)
    .eq("archived", false)
    .order("name");

  const { data: staffList } = await supa
    .from("staff")
    .select("id, name")
    .eq("org_id", session.orgId)
    .eq("active", true)
    .eq("archived", false)
    .order("name");

  const { data: blockedRows } = await supa
    .from("site_blocked_date")
    .select("date, reason")
    .eq("site_id", session.siteId)
    .gte("date", weekStartIso)
    .lte("date", weekEndIso);

  const blockedDates = (blockedRows ?? []).map((r) => ({
    date: r.date as string,
    reason: r.reason as string | null,
  }));

  const enriched = (shifts ?? []).map((row) => {
    const role = Array.isArray(row.role) ? row.role[0] : row.role;
    const area = Array.isArray(row.area) ? row.area[0] : row.area;
    const assignee = Array.isArray(row.assignee) ? row.assignee[0] : row.assignee;
    return {
      id: row.id,
      date: row.date,
      startTime: row.start_time,
      endTime: row.end_time,
      status: row.status as "open" | "filled" | "cancelled",
      roleId: row.role_id,
      roleName: role?.name ?? "",
      roleColour: role?.colour ?? null,
      areaName: area?.name ?? null,
      filledBy: row.filled_by,
      assigneeName: assignee?.name ?? null,
    };
  });

  const days = Array.from({ length: 7 }, (_, i) => toIso(addDays(weekStart, i)));

  return (
    <RotaView
      shifts={enriched}
      roles={roles ?? []}
      staff={staffList ?? []}
      days={days}
      weekStart={weekStartIso}
      siteId={session.siteId}
      memberId={session.memberId}
      blockedDates={blockedDates}
    />
  );
}
