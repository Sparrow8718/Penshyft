import { getLocale, getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/server";
import { CoverageList } from "./coverage-list";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: `${t("coverage")} · ${t("title")} · Penshyft` };
}

export default async function CoveragePage() {
  const locale = await getLocale();
  const session = await requireSession(locale);

  const supa = db();
  const { data: requirements } = await supa
    .from("coverage_requirement")
    .select("id, weekday, start_time, end_time, min_count, label, role_id, area_id, role:role_id (name, colour), area:area_id (name)")
    .eq("site_id", session.siteId)
    .order("weekday")
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

  const enriched = (requirements ?? []).map((r) => {
    const role = Array.isArray(r.role) ? r.role[0] : r.role;
    const area = Array.isArray(r.area) ? r.area[0] : r.area;
    return {
      id: r.id,
      weekday: r.weekday,
      startTime: r.start_time,
      endTime: r.end_time,
      minCount: r.min_count,
      label: r.label,
      roleId: r.role_id,
      roleName: role?.name ?? "",
      roleColour: role?.colour ?? null,
      areaId: r.area_id,
      areaName: area?.name ?? null,
    };
  });

  return (
    <CoverageList
      requirements={enriched}
      roles={roles ?? []}
      areas={areas ?? []}
      siteId={session.siteId}
      areaLabel={session.orgAreaLabel}
    />
  );
}
