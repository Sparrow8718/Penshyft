import { getLocale, getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/server";
import { ProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: `${t("profile")} · ${t("title")} · Penshyft` };
}

export default async function ProfilePage() {
  const locale = await getLocale();
  const session = await requireSession(locale);

  const supa = db();
  const { data: member } = await supa
    .from("member")
    .select("id, name, email, role")
    .eq("id", session.memberId)
    .single();

  return (
    <ProfileForm
      name={member?.name ?? ""}
      email={member?.email ?? session.email}
      role={member?.role ?? "user"}
    />
  );
}
