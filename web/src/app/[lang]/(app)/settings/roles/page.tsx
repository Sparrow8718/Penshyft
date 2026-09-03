import { getLocale, getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/server";
import { RolesList } from "./roles-list";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: `${t("roles")} · ${t("title")} · Penshyft` };
}

export default async function RolesPage() {
  const locale = await getLocale();
  const session = await requireSession(locale);

  const supa = db();
  const { data: roles } = await supa
    .from("role")
    .select("id, name, colour, archived")
    .eq("org_id", session.orgId)
    .order("created_at");

  return <RolesList roles={roles ?? []} orgId={session.orgId} />;
}
