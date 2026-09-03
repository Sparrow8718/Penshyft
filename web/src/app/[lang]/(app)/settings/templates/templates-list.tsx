"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { createTemplate, updateTemplate, deleteTemplate, toggleTemplate } from "./actions";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

type Template = {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  headcount: number;
  active: boolean;
  roleId: string;
  roleName: string;
  roleColour: string | null;
  areaId: string | null;
  areaName: string | null;
};

type Role = { id: string; name: string; colour: string | null };
type Area = { id: string; name: string };

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("siteId", siteId);
    if (editing) fd.set("id", editing.id);
    startTransition(async () => {
      if (editing) await updateTemplate(fd);
      else await createTemplate(fd);
      setDialogOpen(false);
      setEditing(null);
    });
  }

  function handleDelete(id: string) {
    startTransition(() => deleteTemplate(id));
  }

  function handleToggle(id: string, active: boolean) {
    startTransition(() => toggleTemplate(id, !active));
  }

  const grouped = DAYS.map((dayKey, i) => ({
    dayKey,
    items: templates.filter((t) => t.weekday === i),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Shift Templates</h2>
        <Button
          variant="secondary"
          className="h-8 text-xs"
          onClick={() => { setEditing(null); setDialogOpen(true); }}
        >
          <Plus size={14} /> {tc("add")}
        </Button>
      </div>

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
                      <span className="text-sm font-medium">×{tmpl.headcount}</span>
                      {tmpl.areaName && (
                        <span className="text-xs text-muted-foreground">{tmpl.areaName}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleToggle(tmpl.id, tmpl.active)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition"
                      title={tmpl.active ? "Disable" : "Enable"}
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
                      onClick={() => handleDelete(tmpl.id)}
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

      {templates.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No shift templates yet. Add recurring patterns to auto-generate your rota.
        </p>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
        title={editing ? "Edit template" : "Add template"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tmplWeekday">Day</Label>
              <Select id="tmplWeekday" name="weekday" required defaultValue={editing?.weekday?.toString() ?? "0"}>
                {DAYS.map((d, i) => (
                  <option key={d} value={i}>{tr(d)}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="tmplHeadcount">Headcount</Label>
              <Input
                id="tmplHeadcount"
                name="headcount"
                type="number"
                min={1}
                defaultValue={editing?.headcount ?? 1}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tmplStart">Start</Label>
              <Input
                id="tmplStart"
                name="startTime"
                type="time"
                defaultValue={editing?.startTime?.slice(0, 5) ?? "07:00"}
                required
              />
            </div>
            <div>
              <Label htmlFor="tmplEnd">End</Label>
              <Input
                id="tmplEnd"
                name="endTime"
                type="time"
                defaultValue={editing?.endTime?.slice(0, 5) ?? "15:00"}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="tmplRole">Role</Label>
            <Select id="tmplRole" name="roleId" required defaultValue={editing?.roleId ?? ""}>
              <option value="" disabled>Select role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </Select>
          </div>
          {areas.length > 0 && (
            <div>
              <Label htmlFor="tmplArea">{areaLabel}</Label>
              <Select id="tmplArea" name="areaId" defaultValue={editing?.areaId ?? ""}>
                <option value="">None</option>
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
