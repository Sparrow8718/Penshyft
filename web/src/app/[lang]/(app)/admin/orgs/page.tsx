import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { getOrgList } from "@/lib/db/admin-queries";
import { Topbar } from "@/components/topbar";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("admin");
  return { title: `${t("orgBrowser")} · Penshyft` };
}

export default async function OrgBrowserPage() {
  const locale = await getLocale();
  const session = await requireSession(locale);
  if (session.role !== "system_admin") redirect(`/${locale}/dashboard`);

  const t = await getTranslations("admin");
  const orgs = await getOrgList();

  return (
    <>
      <Topbar title={t("orgBrowser")} />
      <div className="px-6 py-6 space-y-4 max-w-6xl w-full">
        <Link
          href={`/${locale}/admin`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft size={12} />
          {t("backToOrgs")}
        </Link>

        {orgs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
            {t("noOrgs")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="py-2 pr-4 font-medium">{t("orgBrowser")}</th>
                  <th className="py-2 pr-4 font-medium">{t("plan")}</th>
                  <th className="py-2 pr-4 font-medium">{t("industry")}</th>
                  <th className="py-2 pr-4 font-medium text-right">{t("staffCount")}</th>
                  <th className="py-2 pr-4 font-medium text-right">{t("memberCount")}</th>
                  <th className="py-2 font-medium">{t("created")}</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((org) => (
                  <tr key={org.id} className="border-b border-border/50 hover:bg-accent/30 transition">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/${locale}/admin/orgs/${org.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {org.name}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${planBadgeClass(org.plan)}`}>
                        {org.plan}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground capitalize">{org.industry}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">{org.staffCount}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">{org.memberCount}</td>
                    <td className="py-3 text-muted-foreground tabular-nums">
                      {new Date(org.createdAt).toLocaleDateString(locale, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function planBadgeClass(plan: string) {
  switch (plan) {
    case "professional":
      return "bg-violet-500/15 text-violet-400";
    case "starter":
      return "bg-emerald-500/15 text-emerald-400";
    default:
      return "bg-zinc-500/15 text-zinc-400";
  }
}
