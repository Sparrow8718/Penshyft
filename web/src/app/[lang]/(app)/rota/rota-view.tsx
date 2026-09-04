"use client";

import { useTranslations, useLocale } from "next-intl";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Sparkles, Send, Copy, Ban } from "lucide-react";
import { generateRota, cloneWeek } from "@/lib/rota/generate";
import { blastShift } from "@/lib/offers/blast";
import { assignShift } from "../shifts/actions";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

type Shift = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "open" | "filled" | "cancelled";
  roleId: string;
  roleName: string;
  roleColour: string | null;
  areaName: string | null;
  filledBy: string | null;
  assigneeName: string | null;
};

type Role = { id: string; name: string; colour: string | null };
type Staff = { id: string; name: string };
type BlockedDate = { date: string; reason: string | null };

export function RotaView({
  shifts,
  roles,
  staff,
  days,
  weekStart,
  siteId,
  memberId,
  blockedDates,
}: {
  shifts: Shift[];
  roles: Role[];
  staff: Staff[];
  days: string[];
  weekStart: string;
  siteId: string;
  memberId: string;
  blockedDates: BlockedDate[];
}) {
  const t = useTranslations("rota");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [assignDialog, setAssignDialog] = useState<Shift | null>(null);
  const [cloneConfirmOpen, setCloneConfirmOpen] = useState(false);
  const [cloneResult, setCloneResult] = useState<string | null>(null);

  const blockedSet = new Set(blockedDates.map((b) => b.date));
  const blockedReasons = new Map(blockedDates.map((b) => [b.date, b.reason]));

  function navigateWeek(offset: number) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + offset * 7);
    router.push(`/${locale}/rota?week=${d.toISOString().slice(0, 10)}`);
  }

  function getNextWeekStart() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  }

  function handleGenerate() {
    startTransition(async () => {
      await generateRota(siteId, weekStart);
      router.refresh();
    });
  }

  function handleClone() {
    setCloneResult(null);
    startTransition(async () => {
      const res = await cloneWeek(siteId, weekStart, getNextWeekStart());
      if (res.error) {
        setCloneResult(res.error);
      } else {
        setCloneResult(t("cloneSuccess", { count: res.clonedCount ?? 0 }));
        router.refresh();
      }
      setCloneConfirmOpen(false);
    });
  }

  function handleAssign(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!assignDialog) return;
    const fd = new FormData(e.currentTarget);
    const staffId = fd.get("staffId") as string;
    startTransition(async () => {
      await assignShift(assignDialog.id, staffId || null);
      setAssignDialog(null);
      router.refresh();
    });
  }

  const hasShifts = shifts.length > 0;

  const shiftsByDate = new Map<string, Shift[]>();
  for (const s of shifts) {
    if (s.status === "cancelled") continue;
    const list = shiftsByDate.get(s.date) ?? [];
    list.push(s);
    shiftsByDate.set(s.date, list);
  }

  const weekLabel = new Date(weekStart).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold">{t("title")}</h1>
          <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2">
          {hasShifts && (
            <Button
              variant="secondary"
              className="h-8 text-xs"
              onClick={() => setCloneConfirmOpen(true)}
              disabled={pending}
            >
              <Copy size={14} />
              {t("cloneToNextWeek")}
            </Button>
          )}
          <Button
            variant="primary"
            className="h-8 text-xs"
            onClick={handleGenerate}
            disabled={pending}
          >
            <Sparkles size={14} />
            {hasShifts ? t("regenerate") : t("generate")}
          </Button>
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

      {/* Clone result message */}
      {cloneResult && (
        <div className={`text-sm px-3 py-2 rounded-md ${cloneResult.includes("error") || cloneResult.includes("No") || cloneResult.includes("blocked") ? "bg-danger/10 text-danger" : "bg-emerald-500/10 text-emerald-600"}`}>
          {cloneResult}
        </div>
      )}

      {/* Week grid */}
      {!hasShifts && blockedDates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">{t("noShifts")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {days.map((date, i) => {
            const dayShifts = shiftsByDate.get(date) ?? [];
            const isBlocked = blockedSet.has(date);
            const blockReason = blockedReasons.get(date);
            const dateObj = new Date(date);
            const dayNum = dateObj.toLocaleDateString(locale, { day: "numeric" });
            return (
              <div
                key={date}
                className={`rounded-lg border p-2 min-h-[120px] ${
                  isBlocked
                    ? "border-danger/30 bg-danger/5"
                    : "border-border bg-card"
                }`}
              >
                <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <span>{t(DAY_KEYS[i])}</span>
                  <span className="text-foreground">{dayNum}</span>
                  {isBlocked && (
                    <span className="ml-auto inline-flex items-center gap-0.5 text-danger text-[10px]" title={blockReason ?? t("blockedDate")}>
                      <Ban size={10} />
                      {blockReason ?? t("blockedDate")}
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  {dayShifts.map((shift) => (
                    <div
                      key={shift.id}
                      className={`w-full rounded-md p-1.5 text-[11px] leading-tight transition border ${
                        shift.status === "open"
                          ? "border-dashed border-warning/40 bg-warning/5"
                          : "border-transparent bg-accent/40"
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Badge colour={shift.roleColour ?? undefined} className="text-[9px] px-1 py-0">
                          {shift.roleName}
                        </Badge>
                        {shift.status === "open" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); startTransition(async () => { await blastShift(shift.id); router.refresh(); }); }}
                            className="ml-auto text-primary hover:text-primary/80"
                            title={t("blastToStaff")}
                          >
                            <Send size={10} />
                          </button>
                        )}
                      </div>
                      <div className="text-muted-foreground mt-0.5">
                        {shift.startTime.slice(0, 5)}–{shift.endTime.slice(0, 5)}
                      </div>
                      {shift.status === "open" ? (
                        <button
                          onClick={() => setAssignDialog(shift)}
                          className="text-warning font-medium hover:underline"
                        >
                          {t("unassigned")}
                        </button>
                      ) : (
                        <div className="text-foreground">
                          {shift.assigneeName}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Clone confirmation dialog */}
      <Dialog
        open={cloneConfirmOpen}
        onClose={() => setCloneConfirmOpen(false)}
        title={t("cloneToNextWeek")}
      >
        <p className="text-sm text-muted-foreground mb-4">
          {t("cloneConfirm", { count: shifts.filter((s) => s.status !== "cancelled").length })}
        </p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setCloneConfirmOpen(false)}>
            {tc("cancel")}
          </Button>
          <Button onClick={handleClone} disabled={pending}>
            {t("cloneToNextWeek")}
          </Button>
        </div>
      </Dialog>

      {/* Assign dialog */}
      <Dialog
        open={!!assignDialog}
        onClose={() => setAssignDialog(null)}
        title={t("assignTitle", { role: assignDialog?.roleName ?? "" })}
      >
        <form onSubmit={handleAssign} className="space-y-4">
          <p className="text-xs text-muted-foreground">
            {assignDialog?.date} · {assignDialog?.startTime.slice(0, 5)}–{assignDialog?.endTime.slice(0, 5)}
          </p>
          <div>
            <Label htmlFor="rotaStaffId">{t("staffMember")}</Label>
            <Select id="rotaStaffId" name="staffId" required>
              <option value="" disabled>{t("selectStaff")}</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setAssignDialog(null)}>
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={pending}>
              {tc("confirm")}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
