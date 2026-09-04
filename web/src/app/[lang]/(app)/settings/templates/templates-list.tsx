"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Sparkles } from "lucide-react";
import { createTemplate, updateTemplate, deleteTemplate, toggleTemplate } from "./actions";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

type Template = {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  minStaff: number;
  maxStaff: number;
  minHours: number | null;
  maxHours: number | null;
  active: boolean;
  roleId: string;
  roleName: string;
  roleColour: string | null;
  areaId: string | null;
  areaName: string | null;
};

type Role = { id: string; name: string; colour: string | null };
type Area = { id: string; name: string };

type Preset = {
  label: string;
  weekdays: number[];
  startTime: string;
  endTime: string;
};

const PRESETS: Preset[] = [
  { label: "presetWeekday", weekdays: [0, 1, 2, 3, 4], startTime: "08:00", endTime: "16:00" },
  { label: "presetExtended", weekdays: [0, 1, 2, 3, 4], startTime: "08:00", endTime: "18:00" },
  { label: "presetEarly", weekdays: [0, 1, 2, 3, 4], startTime: "06:00", endTime: "14:00" },
  { label: "presetLate", weekdays: [0, 1, 2, 3, 4], startTime: "14:00", endTime: "22:00" },
  { label: "presetWeekend", weekdays: [5, 6], startTime: "08:00", endTime: "16:00" },
];

export function TemplatesList({
  templates,
  roles,
  areas,
  siteId,
  areaLabel,
}: {
  templates: Template[];
  roles: Role[];
  areas: Area[];
  siteId: string;
  areaLabel: string;
}) {
  const tc = useTranslations("common");
  const tr = useTranslations("rota");
  const tt = useTranslations("templates");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [pending, startTransition] = useTransition();
  const [presetWeekdays, setPresetWeekdays] = useState<number[] | null>(null);
  const [presetStart, setPresetStart] = useState<string | null>(null);
  const [presetEnd, setPresetEnd] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("siteId", siteId);
    if (editing) {
      fd.set("id", editing.id);
      startTransition(async () => {
        await updateTemplate(fd);
        setDialogOpen(false);
        setEditing(null);
      });
    } else {
      const weekdays = presetWeekdays ?? [Number(fd.get("weekday"))];
      const baseFd = new FormData();
      baseFd.set("siteId", siteId);
      baseFd.set("startTime", fd.get("startTime") as string);
      baseFd.set("endTime", fd.get("endTime") as string);
      baseFd.set("minStaff", fd.get("minStaff") as string);
      baseFd.set("maxStaff", fd.get("maxStaff") as string);
      if (fd.get("minHours")) baseFd.set("minHours", fd.get("minHours") as string);
      if (fd.get("maxHours")) baseFd.set("maxHours", fd.get("maxHours") as string);
      baseFd.set("roleId", fd.get("roleId") as string);
      if (fd.get("areaId")) baseFd.set("areaId", fd.get("areaId") as string);

      startTransition(async () => {
        for (const wd of weekdays) {
          const wdFd = new FormData();
          baseFd.forEach((v, k) => wdFd.set(k, v));
          wdFd.set("weekday", String(wd));
          await createTemplate(wdFd);
        }
        setDialogOpen(false);
        setPresetWeekdays(null);
        setPresetStart(null);
        setPresetEnd(null);
      });
    }
  }

  function handleDelete(id: string) {
    startTransition(() => {
      deleteTemplate(id);
    });
    setConfirmDelete(null);
  }

  function handleToggle(id: string, active: boolean) {
    startTransition(() => {
      toggleTemplate(id, !active);
    });
  }

  function openPreset(preset: Preset) {
    setEditing(null);
    setPresetWeekdays(preset.weekdays);
    setPresetStart(preset.startTime);
    setPresetEnd(preset.endTime);
    setDialogOpen(true);
  }

  function openNew() {
    setEditing(null);
    setPresetWeekdays(null);
    setPresetStart(null);
    setPresetEnd(null);
    setDialogOpen(true);
  }

  const grouped = DAYS.map((dayKey, i) => ({
    dayKey,
    items: templates.filter((t) => t.weekday === i),
  }));

  const hasTemplates = templates.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{tt("title")}</h2>
        <Button
          variant="secondary"
          className="h-8 text-xs"
          onClick={openNew}
        >
          <Plus size={14} /> {tc("add")}
        </Button>
      </div>

      {/* Quick-start presets when empty */}
      {!hasTemplates && (
        <div className="rounded-lg border border-dashed border-border p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <h3 className="text-sm font-semibold">{tt("quickStart")}</h3>
          </div>
          <p className="text-xs text-muted-foreground">{tt("quickStartDesc")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => openPreset(preset)}
                className="flex flex-col gap-1 rounded-lg border border-border bg-card p-3 text-left hover:border-primary/40 hover:bg-accent/30 transition"
              >
                <span className="text-xs font-medium">{tt(preset.label)}</span>
                <span className="text-[11px] text-muted-foreground">
                  {preset.weekdays.map((w) => tr(DAYS[w])).join(", ")} · {preset.startTime}–{preset.endTime}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {grouped.map(({ dayKey, items }) => (
        items.length > 0 && (
          <div key={dayKey}>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              {tr(dayKey)}
            </h3>
            <div className="space-y-2">
              {items.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className={`flex items-center gap-3 rounded-lg border border-border bg-card p-3 ${!tmpl.active ? "opacity-50" : ""}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {tmpl.startTime.slice(0, 5)}–{tmpl.endTime.slice(0, 5)}
                      </span>
                      <Badge colour={tmpl.roleColour ?? undefined}>{tmpl.roleName}</Badge>
                      <span className="text-sm font-medium">
                        {tmpl.minStaff === tmpl.maxStaff
                          ? `×${tmpl.minStaff}`
                          : `${tmpl.minStaff}–${tmpl.maxStaff}`}
                      </span>
                      {tmpl.areaName && (
                        <span className="text-xs text-muted-foreground">{tmpl.areaName}</span>
                      )}
                      {(tmpl.minHours || tmpl.maxHours) && (
                        <span className="text-[10px] text-muted-foreground">
                          {tmpl.minHours && tmpl.maxHours
                            ? `${tmpl.minHours}–${tmpl.maxHours}h`
                            : tmpl.minHours
                              ? `≥${tmpl.minHours}h`
                              : `≤${tmpl.maxHours}h`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleToggle(tmpl.id, tmpl.active)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition"
                      title={tmpl.active ? tt("disable") : tt("enable")}
                    >
                      {tmpl.active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                    </button>
                    <button
                      onClick={() => { setEditing(tmpl); setDialogOpen(true); }}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(tmpl.id)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-danger hover:bg-accent transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ))}

      {hasTemplates && templates.every((t) => !t.active) && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          {tt("allDisabled")}
        </p>
      )}

      {/* Delete confirmation */}
      <Dialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title={tt("deleteConfirm")}
      >
        <p className="text-sm text-muted-foreground mb-4">{tt("deleteConfirmDesc")}</p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setConfirmDelete(null)}>
            {tc("cancel")}
          </Button>
          <Button
            variant="danger"
            onClick={() => confirmDelete && handleDelete(confirmDelete)}
            disabled={pending}
          >
            {tc("delete")}
          </Button>
        </div>
      </Dialog>

      {/* Create/Edit dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null); setPresetWeekdays(null); }}
        title={editing ? tt("editTemplate") : tt("addTemplate")}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editing && !presetWeekdays && (
            <div>
              <Label htmlFor="tmplWeekday">{tt("day")}</Label>
              <Select id="tmplWeekday" name="weekday" required defaultValue="0">
                {DAYS.map((d, i) => (
                  <option key={d} value={i}>{tr(d)}</option>
                ))}
              </Select>
            </div>
          )}
          {!editing && presetWeekdays && (
            <div>
              <Label>{tt("days")}</Label>
              <p className="text-xs text-muted-foreground">
                {presetWeekdays.map((w) => tr(DAYS[w])).join(", ")}
              </p>
            </div>
          )}
          {editing && (
            <div>
              <Label htmlFor="tmplWeekday">{tt("day")}</Label>
              <Select id="tmplWeekday" name="weekday" required defaultValue={editing.weekday.toString()}>
                {DAYS.map((d, i) => (
                  <option key={d} value={i}>{tr(d)}</option>
                ))}
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tmplMinStaff">{tt("minStaff")}</Label>
              <Input
                id="tmplMinStaff"
                name="minStaff"
                type="number"
                min={1}
                defaultValue={editing?.minStaff ?? 1}
                required
              />
            </div>
            <div>
              <Label htmlFor="tmplMaxStaff">{tt("maxStaff")}</Label>
              <Input
                id="tmplMaxStaff"
                name="maxStaff"
                type="number"
                min={1}
                defaultValue={editing?.maxStaff ?? 1}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tmplStart">{tt("startTime")}</Label>
              <Input
                id="tmplStart"
                name="startTime"
                type="time"
                defaultValue={editing?.startTime?.slice(0, 5) ?? presetStart ?? "07:00"}
                required
              />
            </div>
            <div>
              <Label htmlFor="tmplEnd">{tt("endTime")}</Label>
              <Input
                id="tmplEnd"
                name="endTime"
                type="time"
                defaultValue={editing?.endTime?.slice(0, 5) ?? presetEnd ?? "15:00"}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tmplMinHours">{tt("minHours")}</Label>
              <Input
                id="tmplMinHours"
                name="minHours"
                type="number"
                step="0.5"
                min={0}
                defaultValue={editing?.minHours ?? ""}
                placeholder={tt("optional")}
              />
            </div>
            <div>
              <Label htmlFor="tmplMaxHours">{tt("maxHours")}</Label>
              <Input
                id="tmplMaxHours"
                name="maxHours"
                type="number"
                step="0.5"
                min={0}
                defaultValue={editing?.maxHours ?? ""}
                placeholder={tt("optional")}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="tmplRole">{tt("role")}</Label>
            <Select id="tmplRole" name="roleId" required defaultValue={editing?.roleId ?? ""}>
              <option value="" disabled>{tt("selectRole")}</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </Select>
          </div>
          {areas.length > 0 && (
            <div>
              <Label htmlFor="tmplArea">{areaLabel}</Label>
              <Select id="tmplArea" name="areaId" defaultValue={editing?.areaId ?? ""}>
                <option value="">{tc("none")}</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </Select>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={pending}>
              {tc("save")}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
