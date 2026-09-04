"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";
import { updateShiftPattern } from "./pattern-actions";

type Role = { id: string; name: string; colour: string | null };
type Area = { id: string; name: string };

export type PatternData = {
  id: string;
  weekdays: number[];
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string | null;
  minStaff: number;
  autoGenerate: boolean;
  roleId: string;
  areaId: string | null;
  notes: string | null;
};

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export function EditPatternDialog({
  open,
  onClose,
  pattern,
  roles,
  areas,
  siteId,
  areaLabel,
}: {
  open: boolean;
  onClose: () => void;
  pattern: PatternData;
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
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set(pattern.weekdays));
  const [autoGenerate, setAutoGenerate] = useState(pattern.autoGenerate);
  const [minStaff, setMinStaff] = useState(pattern.minStaff);

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
    fd.set("patternId", pattern.id);
    fd.set("siteId", siteId);
    fd.set("weekdays", [...selectedDays].join(","));
    fd.set("minStaff", String(minStaff));
    fd.set("autoGenerate", String(autoGenerate));

    startTransition(async () => {
      const res = await updateShiftPattern(fd);
      if (res?.error) setError(res.error);
      else onClose();
    });
  }

  return (
    <Dialog open={open} onClose={onClose} title={t("editPattern")}>
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
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="epStartTime">{t("startTime")}</Label>
            <Input id="epStartTime" name="startTime" type="time" defaultValue={pattern.startTime.slice(0, 5)} required />
          </div>
          <div>
            <Label htmlFor="epEndTime">{t("endTime")}</Label>
            <Input id="epEndTime" name="endTime" type="time" defaultValue={pattern.endTime.slice(0, 5)} required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="epStartDate">{t("startDate")}</Label>
            <Input id="epStartDate" name="startDate" type="date" defaultValue={pattern.startDate} required />
          </div>
          <div>
            <Label htmlFor="epEndDate">{t("endDate")}</Label>
            <Input id="epEndDate" name="endDate" type="date" defaultValue={pattern.endDate ?? ""} />
            <p className="text-[11px] text-muted-foreground mt-1">{t("ongoing")}</p>
          </div>
        </div>

        <div>
          <Label htmlFor="epMinStaff">{t("staffPerShift")}</Label>
          <Input
            id="epMinStaff"
            type="number"
            min={1}
            value={minStaff}
            onChange={(e) => setMinStaff(Number(e.target.value) || 1)}
          />
        </div>

        <div>
          <Label htmlFor="epRoleId">{t("role")}</Label>
          <Select id="epRoleId" name="roleId" required defaultValue={pattern.roleId}>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </Select>
        </div>

        {areas.length > 0 && (
          <div>
            <Label htmlFor="epAreaId">{areaLabel}</Label>
            <Select id="epAreaId" name="areaId" defaultValue={pattern.areaId ?? ""}>
              <option value="">{tc("none")}</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="epNotes">{t("notes")}</Label>
          <Input id="epNotes" name="notes" defaultValue={pattern.notes ?? ""} />
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

        <p className="text-xs text-muted-foreground">{t("editConfirmDesc")}</p>

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
