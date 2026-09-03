import { getLocale, getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/server";
import { SitesList } from "./sites-list";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: `${t("sites")} · ${t("title")} · Penshyft` };
}

export default async function SitesPage() {
  const locale = await getLocale();
  const session = await requireSession(locale);

  const supa = db();
  const { data: sites } = await supa
    .from("site")
    .select("id, name, address, archived")
    .eq("org_id", session.orgId)
    .order("created_at");

  return (
    <SitesList
      sites={sites ?? []}
      orgId={session.orgId}
      orgPlan={session.orgPlan}
    />
  );
}
