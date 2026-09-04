"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";
import { createShiftPattern } from "./pattern-actions";

type Role = { id: string; name: string; colour: string | null };
type Area = { id: string; name: string };

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export function CreatePatternDialog({
  open,
  onClose,
  roles,
  areas,
  siteId,
  areaLabel,
}: {
  open: boolean;
  onClose: () => void;
  roles: Role[];
  areas: Area[];
  siteId: string;
  areaLabel: string;
}) {
  const t = useTranslations("shifts");
  const tc = useTranslations("common");
  const tr = useTranslations("rota");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [minStaff, setMinStaff] = useState(1);

  const today = new Date().toISOString().slice(0, 10);

  function toggleDay(day: number) {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (selectedDays.size === 0) {
      setError(t("selectDaysError"));
      return;
    }

    const fd = new FormData(e.currentTarget);
    fd.set("siteId", siteId);
    fd.set("weekdays", [...selectedDays].join(","));
    fd.set("minStaff", String(minStaff));
    fd.set("autoGenerate", String(autoGenerate));

    startTransition(async () => {
      const res = await createShiftPattern(fd);
      if (res?.error) setError(res.error);
      else {
        setSelectedDays(new Set());
        setAutoGenerate(false);
        setMinStaff(1);
        onClose();
      }
    });
  }

  return (
    <Dialog open={open} onClose={onClose} title={t("createPattern")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="space-y-2">
          <Label>{t("selectDays")}</Label>
          <div className="flex gap-1.5 flex-wrap">
            {DAY_KEYS.map((key, i) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleDay(i)}
                className={`px-2.5 py-1 text-xs rounded-md border transition ${
                  selectedDays.has(i)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                }`}
              >
                {tr(key)}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedDays(new Set([0, 1, 2, 3, 4]))}
              className="text-[11px] text-primary hover:underline"
            >
              {t("selectWeekdays")}
            </button>
            <button
              type="button"
              onClick={() => setSelectedDays(new Set([0, 1, 2, 3, 4, 5, 6]))}
              className="text-[11px] text-primary hover:underline"
            >
              {t("selectAll")}
            </button>
            <button
              type="button"
              onClick={() => setSelectedDays(new Set())}
              className="text-[11px] text-muted-foreground hover:underline"
            >
              {t("clearSelection")}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="cpStartTime">{t("startTime")}</Label>
            <Input id="cpStartTime" name="startTime" type="time" defaultValue="09:00" required />
          </div>
          <div>
            <Label htmlFor="cpEndTime">{t("endTime")}</Label>
            <Input id="cpEndTime" name="endTime" type="time" defaultValue="17:00" required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="cpStartDate">{t("startDate")}</Label>
            <Input id="cpStartDate" name="startDate" type="date" defaultValue={today} required />
          </div>
          <div>
            <Label htmlFor="cpEndDate">{t("endDate")}</Label>
            <Input id="cpEndDate" name="endDate" type="date" />
            <p className="text-[11px] text-muted-foreground mt-1">{t("ongoing")}</p>
          </div>
        </div>

        <div>
          <Label htmlFor="cpMinStaff">{t("staffPerShift")}</Label>
          <Input
            id="cpMinStaff"
            type="number"
            min={1}
            value={minStaff}
            onChange={(e) => setMinStaff(Number(e.target.value) || 1)}
          />
        </div>

        <div>
          <Label htmlFor="cpRoleId">{t("role")}</Label>
          <Select id="cpRoleId" name="roleId" required defaultValue="">
            <option value="" disabled>{t("selectRole")}</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </Select>
        </div>

        {areas.length > 0 && (
          <div>
            <Label htmlFor="cpAreaId">{areaLabel}</Label>
            <Select id="cpAreaId" name="areaId" defaultValue="">
              <option value="">{tc("none")}</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="cpNotes">{t("notes")}</Label>
          <Input id="cpNotes" name="notes" />
        </div>

        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autoGenerate}
            onChange={(e) => setAutoGenerate(e.target.checked)}
            className="mt-0.5 rounded border-border"
          />
          <div>
            <span className="text-sm font-medium">{t("autoGenerate")}</span>
            <p className="text-[11px] text-muted-foreground">{t("autoGenerateDesc")}</p>
          </div>
        </label>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {tc("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {tc("save")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
