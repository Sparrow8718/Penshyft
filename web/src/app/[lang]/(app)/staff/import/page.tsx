import { getLocale, getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth/session";
import { ImportFlow } from "./import-flow";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("staff");
  return { title: `${t("csvImport")} · Penshyft` };
}

export default async function ImportPage() {
  const locale = await getLocale();
  const session = await requireSession(locale);

  return <ImportFlow orgId={session.orgId} locale={locale} />;
}
