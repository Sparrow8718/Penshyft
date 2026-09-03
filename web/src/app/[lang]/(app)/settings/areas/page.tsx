import { getLocale, getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/server";
import { AreasList } from "./areas-list";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: `${t("areas")} · ${t("title")} · Penshyft` };
}

export default async function AreasPage() {
  const locale = await getLocale();
  const session = await requireSession(locale);

  const supa = db();
  const { data: sites } = await supa
    .from("site")
    .select("id, name")
    .eq("org_id", session.orgId)
    .eq("archived", false)
    .order("created_at");

  const { data: areas } = await supa
    .from("area")
    .select("id, name, archived, site_id")
    .in("site_id", (sites ?? []).map((s) => s.id))
    .order("created_at");

  return (
    <AreasList
      areas={areas ?? []}
      sites={sites ?? []}
      areaLabel={session.orgAreaLabel}
    />
  );
}
