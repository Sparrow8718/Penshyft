import { getLocale, getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/server";
import { TemplatesList } from "./templates-list";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: `${t("templates")} · ${t("title")} · Penshyft` };
}

export default async function TemplatesPage() {
  const locale = await getLocale();
  const session = await requireSession(locale);

  const supa = db();
  const { data: templates } = await supa
    .from("shift_template")
    .select("id, weekday, start_time, end_time, headcount, active, role_id, area_id, role:role_id (name, colour), area:area_id (name)")
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

  const enriched = (templates ?? []).map((t) => {
    const role = Array.isArray(t.role) ? t.role[0] : t.role;
    const area = Array.isArray(t.area) ? t.area[0] : t.area;
    return {
      id: t.id,
      weekday: t.weekday,
      startTime: t.start_time,
      endTime: t.end_time,
      headcount: t.headcount,
      active: t.active,
      roleId: t.role_id,
      roleName: role?.name ?? "",
      roleColour: role?.colour ?? null,
      areaId: t.area_id,
      areaName: area?.name ?? null,
    };
  });

  return (
    <TemplatesList
      templates={enriched}
      roles={roles ?? []}
      areas={areas ?? []}
      siteId={session.siteId}
      areaLabel={session.orgAreaLabel}
    />
  );
}
