import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/server";
import { Topbar } from "@/components/topbar";
import { ActivityFeed } from "./activity-feed";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set(["system_admin", "org_admin", "org_manager"]);
const PAGE_SIZE = 30;

export async function generateMetadata() {
  const t = await getTranslations("activity");
  return { title: `${t("title")} · Penshyft` };
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const locale = await getLocale();
  const session = await requireSession(locale);

  if (!ALLOWED_ROLES.has(session.role)) {
    redirect(`/${locale}/dashboard`);
  }

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const t = await getTranslations("activity");
  const supa = db();

  const { data: rows, count } = await supa
    .from("audit_log")
    .select("id, actor, action, entity, meta, created_at", { count: "exact" })
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <>
      <Topbar title={t("title")} subtitle={t("subtitle")} />
      <div className="px-6 py-6 max-w-3xl w-full">
        <ActivityFeed
          entries={(rows ?? []).map((r) => ({
            id: r.id,
            actor: r.actor ?? "System",
            action: r.action,
            entity: r.entity,
            meta: r.meta as Record<string, unknown> | null,
            createdAt: r.created_at,
          }))}
          page={page}
          totalPages={totalPages}
          locale={locale}
        />
      </div>
    </>
  );
}
