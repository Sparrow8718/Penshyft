import { getLocale, getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/server";
import { OrgSettingsForm } from "./org-form";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: `${t("org")} · ${t("title")} · Penshyft` };
}

export default async function OrgSettingsPage() {
  const locale = await getLocale();
  const session = await requireSession(locale);

  const { data: org } = await db()
    .from("org")
    .select("generation_horizon_unit, generation_horizon_value")
    .eq("id", session.orgId)
    .single();

  return (
    <OrgSettingsForm
      orgId={session.orgId}
      orgName={session.orgName}
      industry={session.orgIndustry}
      areaLabel={session.orgAreaLabel}
      horizonUnit={org?.generation_horizon_unit ?? "months"}
      horizonValue={org?.generation_horizon_value ?? 1}
    />
  );
}
