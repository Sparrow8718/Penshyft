import { getLocale, getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth/session";
import { OrgSettingsForm } from "./org-form";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: `${t("org")} · ${t("title")} · Penshyft` };
}

export default async function OrgSettingsPage() {
  const locale = await getLocale();
  const session = await requireSession(locale);

  return (
    <OrgSettingsForm
      orgId={session.orgId}
      orgName={session.orgName}
      industry={session.orgIndustry}
      areaLabel={session.orgAreaLabel}
    />
  );
}
