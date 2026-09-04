import { getLocale, getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/server";
import { StaffList } from "./staff-list";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("staff");
  return { title: `${t("title")} · Penshyft` };
}

export default async function StaffPage() {
  const locale = await getLocale();
  const session = await requireSession(locale);

  const supa = db();

  const { data: staff } = await supa
    .from("staff")
    .select("id, name, email, mobile, notes, active, archived, org_id, max_hours_per_week, max_hours_per_day, max_days_per_week")
    .eq("org_id", session.orgId)
    .order("name");

  const staffIds = (staff ?? []).map((s) => s.id);

  const { data: staffRoles } = staffIds.length
    ? await supa
        .from("staff_role")
        .select("staff_id, role_id, role:role_id (name, colour)")
        .in("staff_id", staffIds)
    : { data: [] };

  const { data: staffAreas } = staffIds.length
    ? await supa
        .from("staff_area")
        .select("staff_id, area_id, area:area_id (name)")
        .in("staff_id", staffIds)
    : { data: [] };

  const { data: roles } = await supa
    .from("role")
    .select("id, name, colour")
    .eq("org_id", session.orgId)
    .eq("archived", false)
    .order("name");

  const { data: areas } = await supa
    .from("area")
    .select("id, name, site_id")
    .in(
      "site_id",
      (
        await supa
          .from("site")
          .select("id")
          .eq("org_id", session.orgId)
          .eq("archived", false)
      ).data?.map((s) => s.id) ?? [],
    )
    .eq("archived", false)
    .order("name");

  const roleMap = new Map<string, { role_id: string; name: string; colour: string | null }[]>();
  for (const sr of staffRoles ?? []) {
    const role = Array.isArray(sr.role) ? sr.role[0] : sr.role;
    const entry = { role_id: sr.role_id, name: role?.name ?? "", colour: role?.colour ?? null };
    const list = roleMap.get(sr.staff_id) ?? [];
    list.push(entry);
    roleMap.set(sr.staff_id, list);
  }

  const areaMap = new Map<string, { area_id: string; name: string }[]>();
  for (const sa of staffAreas ?? []) {
    const area = Array.isArray(sa.area) ? sa.area[0] : sa.area;
    const entry = { area_id: sa.area_id, name: area?.name ?? "" };
    const list = areaMap.get(sa.staff_id) ?? [];
    list.push(entry);
    areaMap.set(sa.staff_id, list);
  }

  const enriched = (staff ?? []).map((s) => ({
    ...s,
    roles: roleMap.get(s.id) ?? [],
    areas: areaMap.get(s.id) ?? [],
  }));

  const activeCount = enriched.filter((s) => s.active && !s.archived).length;

  return (
    <StaffList
      staff={enriched}
      roles={roles ?? []}
      areas={areas ?? []}
      orgId={session.orgId}
      orgPlan={session.orgPlan}
      areaLabel={session.orgAreaLabel}
      activeCount={activeCount}
    />
  );
}
