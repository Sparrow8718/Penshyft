"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowLeft, Check, X } from "lucide-react";
import { toggleAvailability, bulkSetAvailability } from "./actions";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

type StaffMember = { id: string; name: string };
type AvailMap = Record<string, Record<string, { available: boolean; notes: string | null }>>;

export function AvailabilityCalendar({
  staff,
  days,
  availability,
  weekStart,
  locale,
}: {
  staff: StaffMember[];
  days: string[];
  availability: AvailMap;
  weekStart: string;
  locale: string;
}) {
  const t = useTranslations("availability");
  const tr = useTranslations("rota");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function navigateWeek(offset: number) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + offset * 7);
    router.push(`/${locale}/staff/availability?week=${d.toISOString().slice(0, 10)}`);
  }

  function handleToggle(staffId: string, date: string, currentlyAvailable: boolean) {
    startTransition(async () => {
      await toggleAvailability(staffId, date, !currentlyAvailable);
    });
  }

  function handleMarkAll(staffId: string, available: boolean) {
    startTransition(async () => {
      await bulkSetAvailability(staffId, days, available);
    });
  }

  const weekLabel = new Date(weekStart).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(`/${locale}/staff`)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-accent transition"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-lg font-semibold">{t("title")}</h1>
          <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      {/* Week picker */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigateWeek(-1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-accent transition"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium min-w-[140px] text-center">
          {t("weekOf", { date: weekLabel })}
        </span>
        <button
          onClick={() => navigateWeek(1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-accent transition"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {staff.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">{t("noStaff")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground w-40">
                  Staff
                </th>
                {days.map((date, i) => {
                  const dayNum = new Date(date).toLocaleDateString(locale, { day: "numeric" });
                  return (
                    <th key={date} className="text-center px-1 py-2 text-xs font-medium text-muted-foreground">
                      <div>{tr(DAY_KEYS[i])}</div>
                      <div className="text-foreground">{dayNum}</div>
                    </th>
                  );
                })}
                <th className="text-center px-2 py-2 text-xs font-medium text-muted-foreground">
                  {t("markAll")}
                </th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member.id} className="border-t border-border">
                  <td className="px-3 py-2 text-sm truncate max-w-[160px]">
                    {member.name}
                  </td>
                  {days.map((date) => {
                    const cell = availability[member.id]?.[date];
                    const isAvailable = cell?.available ?? true;
                    return (
                      <td key={date} className="text-center px-1 py-2">
                        <button
                          onClick={() => handleToggle(member.id, date, isAvailable)}
                          disabled={pending}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition ${
                            isAvailable
                              ? "bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25"
                              : "bg-red-500/15 text-red-400 hover:bg-red-500/25"
                          }`}
                          title={isAvailable ? t("available") : t("unavailable")}
                        >
                          {isAvailable ? <Check size={14} /> : <X size={14} />}
                        </button>
                      </td>
                    );
                  })}
                  <td className="text-center px-2 py-2">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => handleMarkAll(member.id, true)}
                        disabled={pending}
                        className="text-xs text-emerald-500 hover:underline"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={() => handleMarkAll(member.id, false)}
                        disabled={pending}
                        className="text-xs text-red-400 hover:underline"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
