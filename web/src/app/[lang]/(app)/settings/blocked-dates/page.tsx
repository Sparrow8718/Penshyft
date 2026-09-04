import { getLocale, getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/server";
import { BlockedDatesList } from "./blocked-dates-list";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: `${t("blockedDates")} · ${t("title")} · Penshyft` };
}

export default async function BlockedDatesPage() {
  const locale = await getLocale();
  const session = await requireSession(locale);

  const supa = db();
  const { data: rows } = await supa
    .from("site_blocked_date")
    .select("id, date, reason")
    .eq("site_id", session.siteId)
    .order("date", { ascending: false });

  const blockedDates = (rows ?? []).map((r) => ({
    id: r.id,
    date: r.date as string,
    reason: r.reason as string | null,
  }));

  return <BlockedDatesList blockedDates={blockedDates} siteId={session.siteId} />;
}
