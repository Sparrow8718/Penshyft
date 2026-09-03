import { getLocale, getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/server";
import { MembersList } from "./members-list";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: `${t("members")} · ${t("title")} · Penshyft` };
}

export default async function MembersPage() {
  const locale = await getLocale();
  const session = await requireSession(locale);

  if (!["system_admin", "org_admin"].includes(session.role)) {
    return (
      <p className="text-sm text-muted-foreground p-6">
        You do not have permission to manage members.
      </p>
    );
  }

  const supa = db();
  const { data: members } = await supa
    .from("member")
    .select("id, name, email, role, status, invited_at")
    .eq("org_id", session.orgId)
    .order("created_at");

  return (
    <MembersList
      members={members ?? []}
      currentMemberId={session.memberId}
    />
  );
}
