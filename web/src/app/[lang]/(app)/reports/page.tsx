import { getLocale, getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth/session";
import { getShiftReport, getStaffHoursReport, getOfferMetrics } from "@/lib/db/report-queries";
import { ReportView } from "./report-view";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: `${t("reports")} · Penshyft` };
}

function getMonday(d: Date): string {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff).toISOString().slice(0, 10);
}

function getSunday(d: Date): string {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? 0 : 7);
  return new Date(d.getFullYear(), d.getMonth(), diff).toISOString().slice(0, 10);
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const locale = await getLocale();
  const session = await requireSession(locale);
  const params = await searchParams;

  const now = new Date();
  const from = params.from ?? getMonday(now);
  const to = params.to ?? getSunday(now);

  const [shifts, staffHours, offerMetrics] = await Promise.all([
    getShiftReport(session.siteId, from, to),
    getStaffHoursReport(session.siteId, from, to),
    getOfferMetrics(session.siteId, from, to),
  ]);

  const totalShifts = shifts.length;
  const filledShifts = shifts.filter((s) => s.status === "filled").length;
  const fillRate = totalShifts > 0 ? Math.round((filledShifts / totalShifts) * 100) : 0;
  const totalHours = staffHours.reduce((acc, s) => acc + s.totalHours, 0);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-lg font-semibold">Reports</h1>
      <ReportView
        from={from}
        to={to}
        totalShifts={totalShifts}
        filledShifts={filledShifts}
        fillRate={fillRate}
        totalStaffHours={Math.round(totalHours * 10) / 10}
        avgResponseMinutes={offerMetrics.avgResponseMinutes}
        offerMetrics={offerMetrics}
        shifts={shifts}
        staffHours={staffHours}
      />
    </div>
  );
}
