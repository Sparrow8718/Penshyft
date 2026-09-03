import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { getOrgDetail } from "@/lib/db/admin-queries";
import { Topbar } from "@/components/topbar";
import { ArrowLeft } from "lucide-react";
import { ImpersonateButton } from "./impersonate-button";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ orgId: string }> }) {
  const t = await getTranslations("admin");
  return { title: `${t("orgDetail")} · Penshyft` };
}

export default async function OrgDetailPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const locale = await getLocale();
  const session = await requireSession(locale);
  if (session.role !== "system_admin") redirect(`/${locale}/dashboard`);

  const t = await getTranslations("admin");
  const org = await getOrgDetail(orgId);

  if (!org) {
    redirect(`/${locale}/admin/orgs`);
  }

  return (
    <>
      <Topbar title={org.name} subtitle={t("orgDetail")} />
      <div className="px-6 py-6 space-y-8 max-w-6xl w-full">
        <div className="flex items-center justify-between">
          <Link
            href={`/${locale}/admin/orgs`}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft size={12} />
            {t("backToOrgs")}
          </Link>
          <ImpersonateButton orgId={org.id} label={t("viewAsOrg")} />
        </div>

        {/* Org header */}
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${planBadgeClass(org.plan)}`}>
            {org.plan}
          </span>
          <span className="text-sm text-muted-foreground capitalize">{org.industry}</span>
          <span className="text-sm text-muted-foreground">·</span>
          <span className="text-sm text-muted-foreground">
            {t("created")}: {new Date(org.createdAt).toLocaleDateString(locale, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Usage */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            {t("usage")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <UsageBar label={t("staffCount")} current={org.usage.staff.current} max={org.usage.staff.max} />
            <UsageBar label={t("sites")} current={org.usage.sites.current} max={org.usage.sites.max} />
            <UsageBar label={t("areas")} current={org.usage.areas.current} max={org.usage.areas.max} />
          </div>
        </section>

        {/* Sites */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            {t("sites")} ({org.sites.length})
          </h2>
          {org.sites.length === 0 ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <div className="space-y-2">
              {org.sites.map((site) => (
                <div
                  key={site.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{site.name}</p>
                    {site.address && (
                      <p className="text-xs text-muted-foreground">{site.address}</p>
                    )}
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{site.areaCount} {t("areas")}</span>
                    <span>{site.staffCount} {t("staffCount")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Members */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            {t("members")} ({org.members.length})
          </h2>
          {org.members.length === 0 ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="py-2 pr-4 font-medium">Email</th>
                    <th className="py-2 font-medium">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {org.members.map((m) => (
                    <tr key={m.id} className="border-b border-border/50">
                      <td className="py-2 pr-4">{m.name}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{m.email}</td>
                      <td className="py-2 capitalize">{m.role.replace("_", " ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function UsageBar({
  label,
  current,
  max,
}: {
  label: string;
  current: number;
  max: number;
}) {
  const pct = max > 0 ? Math.min(Math.round((current / max) * 100), 100) : 0;
  const isNearLimit = pct >= 80;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold tabular-nums">
          {current}/{max}
        </span>
      </div>
      <div className="h-2 rounded-full bg-accent overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isNearLimit ? "bg-amber-500" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
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
