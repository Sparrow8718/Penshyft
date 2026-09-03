import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/server";
import { Topbar } from "@/components/topbar";
import { CoverageBar } from "@/components/coverage-bar";
import { ShiftCard } from "@/components/shift-card";
import { StatCard } from "@/components/stat-card";
import {
  getCoverageForToday,
  getTodayShifts,
  getSiteName,
  getWeeklyStats,
  getStaffUtilisation,
} from "@/lib/db/queries";
import { CalendarClock, Users, Upload, BarChart3, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("dashboard");
  return { title: `${t("title")} · Penshyft` };
}

export default async function DashboardPage() {
  const locale = await getLocale();
  const session = await requireSession(locale);

  const { data: org } = await db()
    .from("org")
    .select("onboarding_completed")
    .eq("id", session.orgId)
    .single();

  if (org && !org.onboarding_completed) {
    redirect(`/${locale}/onboarding`);
  }

  const t = await getTranslations("dashboard");

  const [coverage, shifts, siteName, weekStats, utilisation] = await Promise.all([
    getCoverageForToday(session.siteId),
    getTodayShifts(session.siteId),
    getSiteName(session.siteId),
    getWeeklyStats(session.siteId),
    getStaffUtilisation(session.siteId),
  ]);

  const subtitle = new Date().toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const fillRate =
    weekStats.totalShifts > 0
      ? Math.round((weekStats.filledShifts / weekStats.totalShifts) * 100)
      : 0;

  const responseRate =
    weekStats.offersSent > 0
      ? Math.round((weekStats.offersResponded / weekStats.offersSent) * 100)
      : 0;

  return (
    <>
      <Topbar title={t("title")} subtitle={subtitle} />
      <div className="px-6 py-6 space-y-8 max-w-6xl w-full">
        {/* Weekly stats */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            {t("thisWeek")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={t("totalShifts")}
              value={weekStats.totalShifts}
              subtext={`${weekStats.openShifts} open · ${weekStats.filledShifts} filled`}
              icon={<CalendarClock size={14} />}
            />
            <StatCard
              label={t("fillRate")}
              value={`${fillRate}%`}
              subtext={`${weekStats.filledShifts} of ${weekStats.totalShifts}`}
              icon={<BarChart3 size={14} />}
            />
            <StatCard
              label={t("offerResponseRate")}
              value={weekStats.offersSent > 0 ? `${responseRate}%` : "—"}
              subtext={weekStats.offersSent > 0 ? `${weekStats.offersResponded} of ${weekStats.offersSent}` : undefined}
              icon={<Users size={14} />}
            />
            <StatCard
              label={t("staffUtilisation")}
              value={utilisation.length}
              subtext={t("noStaffData")}
              icon={<Users size={14} />}
            />
          </div>
        </section>

        {/* Coverage now */}
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {t("coverageNow")}
            </h2>
            <span className="text-xs text-muted-foreground">{siteName}</span>
          </div>
          {coverage.length === 0 ? (
            <EmptyBox text={t("noCoverage")} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {coverage.map((c) => (
                <CoverageBar
                  key={c.roleId}
                  role={c.role}
                  colour={c.colour ?? "#94a3b8"}
                  filled={c.filled}
                  needed={c.needed}
                />
              ))}
            </div>
          )}
        </section>

        {/* Today's shifts */}
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {t("todayShifts")}
            </h2>
            <Link
              href={`/${locale}/shifts`}
              className="text-xs text-primary hover:underline"
            >
              {t("postShift")}
            </Link>
          </div>
          {shifts.length === 0 ? (
            <EmptyBox text={t("noShifts")} />
          ) : (
            <div className="grid gap-3">
              {shifts.map((s) => (
                <ShiftCard
                  key={s.id}
                  role={s.role}
                  time={s.time}
                  status={s.status}
                  who={s.who}
                />
              ))}
            </div>
          )}
        </section>

        {/* Staff utilisation */}
        {utilisation.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
              {t("staffUtilisation")}
            </h2>
            <div className="space-y-2">
              {utilisation.map((u) => {
                const maxCount = utilisation[0].shiftCount;
                const pct = maxCount > 0 ? Math.round((u.shiftCount / maxCount) * 100) : 0;
                return (
                  <div key={u.staffId} className="flex items-center gap-3">
                    <span className="text-sm w-32 truncate">{u.staffName}</span>
                    <div className="flex-1 h-2 rounded-full bg-accent overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">
                      {u.shiftCount}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Quick actions */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            {t("quickActions")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <QuickAction
              href={`/${locale}/rota`}
              icon={<Sparkles size={16} />}
              label={t("generateRota")}
            />
            <QuickAction
              href={`/${locale}/staff/import`}
              icon={<Upload size={16} />}
              label={t("importStaff")}
            />
            <QuickAction
              href={`/${locale}/settings/coverage`}
              icon={<BarChart3 size={16} />}
              label={t("manageCoverage")}
            />
          </div>
        </section>
      </div>
    </>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-sm hover:bg-accent transition"
    >
      <span className="text-primary">{icon}</span>
      {label}
    </Link>
  );
}
