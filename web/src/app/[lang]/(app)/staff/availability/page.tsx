import { getLocale, getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/server";
import { AvailabilityCalendar } from "./availability-calendar";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("availability");
  return { title: `${t("title")} · Penshyft` };
}

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const locale = await getLocale();
  const session = await requireSession(locale);
  const sp = await searchParams;

  const weekStart = sp.week ? new Date(sp.week) : getMonday(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const mondayIso = weekStart.toISOString().slice(0, 10);
  const sundayIso = weekEnd.toISOString().slice(0, 10);

  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }

  const supa = db();

  const [staffRes, availRes] = await Promise.all([
    supa
      .from("staff")
      .select("id, name")
      .eq("org_id", session.orgId)
      .eq("active", true)
      .eq("archived", false)
      .order("name"),
    supa
      .from("staff_availability")
      .select("staff_id, date, available, notes")
      .gte("date", mondayIso)
      .lte("date", sundayIso),
  ]);

  const staff = staffRes.data ?? [];
  const availability: Record<string, Record<string, { available: boolean; notes: string | null }>> = {};

  for (const row of availRes.data ?? []) {
    if (!availability[row.staff_id]) availability[row.staff_id] = {};
    availability[row.staff_id][row.date] = {
      available: row.available,
      notes: row.notes,
    };
  }

  return (
    <AvailabilityCalendar
      staff={staff}
      days={days}
      availability={availability}
      weekStart={mondayIso}
      locale={locale}
    />
  );
}
