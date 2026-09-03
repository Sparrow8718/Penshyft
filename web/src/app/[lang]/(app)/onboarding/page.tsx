import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/server";
import { OnboardingWizard } from "./onboarding-wizard";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("onboarding");
  return { title: `${t("welcomeTitle")} · Penshyft` };
}

export default async function OnboardingPage() {
  const locale = await getLocale();
  const session = await requireSession(locale);

  const { data: org } = await db()
    .from("org")
    .select("onboarding_completed")
    .eq("id", session.orgId)
    .single();

  if (org?.onboarding_completed) {
    redirect(`/${locale}/dashboard`);
  }

  return <OnboardingWizard locale={locale} />;
}
