import { getLocale, getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/server";
import { NotificationForm } from "./notification-form";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: `${t("notifications")} · ${t("title")} · Penshyft` };
}

export default async function NotificationsPage() {
  const locale = await getLocale();
  const session = await requireSession(locale);

  const { data: rows } = await db()
    .from("notification_pref")
    .select("category, enabled")
    .eq("member_id", session.memberId)
    .eq("channel", "email");

  const prefs: Record<string, boolean> = {};
  for (const row of rows ?? []) {
    prefs[row.category] = row.enabled;
  }

  return (
    <div className="p-6 max-w-xl">
      <NotificationForm prefs={prefs} />
    </div>
  );
}
