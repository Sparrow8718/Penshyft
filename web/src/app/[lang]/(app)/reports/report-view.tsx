"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

type ShiftRow = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  roleName: string;
  areaName: string | null;
  staffName: string | null;
};

type StaffHoursRow = {
  staffId: string;
  staffName: string;
  shiftCount: number;
  totalHours: number;
};

type OfferMetrics = {
  totalOffers: number;
  accepted: number;
  declined: number;
  pending: number;
  avgResponseMinutes: number | null;
};

export function ReportView({
  from,
  to,
  totalShifts,
  filledShifts,
  fillRate,
  totalStaffHours,
  avgResponseMinutes,
  offerMetrics,
  shifts,
  staffHours,
}: {
  from: string;
  to: string;
  totalShifts: number;
  filledShifts: number;
  fillRate: number;
  totalStaffHours: number;
  avgResponseMinutes: number | null;
  offerMetrics: OfferMetrics;
  shifts: ShiftRow[];
  staffHours: StaffHoursRow[];
}) {
  const t = useTranslations("reports");
  const router = useRouter();
  const pathname = usePathname();
  const [dateFrom, setDateFrom] = useState(from);
  const [dateTo, setDateTo] = useState(to);

  function applyRange() {
    router.push(`${pathname}?from=${dateFrom}&to=${dateTo}`);
  }

  function exportCsv() {
    const header = "Date,Start,End,Role,Area,Status,Staff\n";
    const rows = shifts
      .map(
        (s) =>
          `${s.date},${s.startTime},${s.endTime},${s.roleName},${s.areaName ?? ""},${s.status},${s.staffName ?? ""}`,
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shifts-report-${from}-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportPdf() {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(t("pdfTitle"), 14, 20);
    doc.setFontSize(10);
    doc.text(`${from} — ${to}`, 14, 28);

    doc.setFontSize(11);
    doc.text(`${t("totalShifts")}: ${totalShifts}`, 14, 40);
    doc.text(`${t("filled")}: ${filledShifts} (${fillRate}%)`, 14, 47);
    doc.text(`${t("staffHours")}: ${totalStaffHours}`, 14, 54);
    doc.text(
      `${t("avgResponse")}: ${avgResponseMinutes != null ? `${avgResponseMinutes} min` : "—"}`,
      14,
      61,
    );

    autoTable(doc, {
      startY: 72,
      head: [[t("colDate"), t("colStart"), t("colEnd"), t("colRole"), t("colArea"), t("colStatus"), t("colStaff")]],
      body: shifts.map((s) => [
        s.date,
        s.startTime,
        s.endTime,
        s.roleName,
        s.areaName ?? "",
        s.status,
        s.staffName ?? "",
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY = ((doc as any).lastAutoTable?.finalY as number) ?? 120;

    if (staffHours.length > 0) {
      autoTable(doc, {
        startY: finalY + 12,
        head: [["Staff", "Shifts", "Hours"]],
        body: staffHours.map((s) => [s.staffName, String(s.shiftCount), String(s.totalHours)]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      });
    }

    doc.save(`shifts-report-${from}-${to}.pdf`);
  }

  const stats = [
    { label: t("totalShifts"), value: totalShifts },
    { label: t("filled"), value: filledShifts },
    { label: t("fillRate"), value: `${fillRate}%` },
    { label: t("staffHours"), value: totalStaffHours },
    {
      label: t("avgResponse"),
      value: avgResponseMinutes != null ? `${avgResponseMinutes}m` : "—",
    },
    { label: t("offersSent"), value: offerMetrics.totalOffers },
  ];

  return (
    <div className="space-y-6">
      {/* Date range */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">{t("from")}</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">{t("to")}</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <Button variant="secondary" className="h-8 text-xs" onClick={applyRange}>
          {t("apply")}
        </Button>
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" className="h-8 text-xs" onClick={exportCsv}>
            <Download size={13} /> {t("csv")}
          </Button>
          <Button variant="ghost" className="h-8 text-xs" onClick={exportPdf}>
            <FileText size={13} /> {t("pdf")}
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-border bg-card p-3 text-center"
          >
            <div className="text-lg font-semibold">{s.value}</div>
            <div className="text-[11px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Shifts table */}
      <div>
        <h2 className="text-sm font-semibold mb-2">{t("shiftsSection")}</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead className="bg-accent/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">{t("colDate")}</th>
                <th className="px-3 py-2 text-left font-medium">{t("colTime")}</th>
                <th className="px-3 py-2 text-left font-medium">{t("colRole")}</th>
                <th className="px-3 py-2 text-left font-medium">{t("colArea")}</th>
                <th className="px-3 py-2 text-left font-medium">{t("colStatus")}</th>
                <th className="px-3 py-2 text-left font-medium">{t("colStaff")}</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-3 py-2">{s.date}</td>
                  <td className="px-3 py-2">
                    {s.startTime}–{s.endTime}
                  </td>
                  <td className="px-3 py-2">{s.roleName}</td>
                  <td className="px-3 py-2">{s.areaName ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        s.status === "filled"
                          ? "text-emerald-600"
                          : "text-amber-600"
                      }
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">{s.staffName ?? "—"}</td>
                </tr>
              ))}
              {shifts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                    {t("noShifts")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff hours table */}
      {staffHours.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-2">{t("staffHoursSection")}</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead className="bg-accent/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">{t("colStaff")}</th>
                  <th className="px-3 py-2 text-right font-medium">{t("colShifts")}</th>
                  <th className="px-3 py-2 text-right font-medium">{t("colHours")}</th>
                </tr>
              </thead>
              <tbody>
                {staffHours.map((s) => (
                  <tr key={s.staffId} className="border-t border-border">
                    <td className="px-3 py-2">{s.staffName}</td>
                    <td className="px-3 py-2 text-right">{s.shiftCount}</td>
                    <td className="px-3 py-2 text-right">{s.totalHours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
