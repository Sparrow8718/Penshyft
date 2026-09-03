import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { getPlatformStats } from "@/lib/db/admin-queries";
import { Topbar } from "@/components/topbar";
import { StatCard } from "@/components/stat-card";
import { Building2, Users, UserCheck, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("admin");
  return { title: `${t("title")} · Penshyft` };
}

export default async function AdminPage() {
  const locale = await getLocale();
  const session = await requireSession(locale);
  if (session.role !== "system_admin") redirect(`/${locale}/dashboard`);

  const t = await getTranslations("admin");
  const stats = await getPlatformStats();

  const maxSignups = Math.max(...stats.signups.map((s) => s.count), 1);

  return (
    <>
      <Topbar title={t("title")} subtitle={t("platformStats")} />
      <div className="px-6 py-6 space-y-8 max-w-6xl w-full">
        <section>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label={t("totalOrgs")}
              value={stats.totalOrgs}
              icon={<Building2 size={14} />}
            />
            <StatCard
              label={t("totalMembers")}
              value={stats.totalMembers}
              icon={<Users size={14} />}
            />
            <StatCard
              label={t("totalStaff")}
              value={stats.totalStaff}
              icon={<UserCheck size={14} />}
            />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            {t("planDistribution")}
          </h2>
          <div className="flex gap-3 flex-wrap">
            {stats.planDistribution.map((p) => (
              <div
                key={p.plan}
                className="rounded-lg border border-border bg-card px-4 py-3 text-center min-w-[100px]"
              >
                <p className="text-2xl font-semibold">{p.count}</p>
                <p className="text-xs text-muted-foreground capitalize">{p.plan}</p>
              </div>
            ))}
          </div>
        </section>

        {stats.signups.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
              {t("signupsOverTime")}
            </h2>
            <div className="space-y-1.5">
              {stats.signups.map((s) => {
                const pct = Math.round((s.count / maxSignups) * 100);
                return (
                  <div key={s.date} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-20 shrink-0">
                      {new Date(s.date + "T00:00:00").toLocaleDateString(locale, {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-accent overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-6 text-right">
                      {s.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <Link
            href={`/${locale}/admin/orgs`}
            className="flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:bg-accent transition"
          >
            <div className="flex items-center gap-3">
              <Building2 size={16} className="text-primary" />
              <span className="text-sm font-medium">{t("orgBrowser")}</span>
            </div>
            <ChevronRight size={16} className="text-muted-foreground" />
          </Link>
        </section>
      </div>
    </>
  );
}
