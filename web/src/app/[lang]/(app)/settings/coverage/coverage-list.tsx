"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { createCoverage, updateCoverage, deleteCoverage } from "./actions";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

type Requirement = {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  minCount: number;
  label: string | null;
  roleId: string;
  roleName: string;
  roleColour: string | null;
  areaId: string | null;
  areaName: string | null;
};

type Role = { id: string; name: string; colour: string | null };
type Area = { id: string; name: string };

export function CoverageList({
  requirements,
  roles,
  areas,
  siteId,
  areaLabel,
}: {
  requirements: Requirement[];
  roles: Role[];
  areas: Area[];
  siteId: string;
  areaLabel: string;
}) {
  const tc = useTranslations("common");
  const tr = useTranslations("rota");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Requirement | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("siteId", siteId);
    if (editing) fd.set("id", editing.id);
    startTransition(async () => {
      if (editing) await updateCoverage(fd);
      else await createCoverage(fd);
      setDialogOpen(false);
      setEditing(null);
    });
  }

  function handleDelete(id: string) {
    startTransition(() => deleteCoverage(id));
  }

  const grouped = DAYS.map((dayKey, i) => ({
    dayKey,
    weekday: i,
    items: requirements.filter((r) => r.weekday === i),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Coverage Requirements</h2>
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
              {items.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {req.startTime.slice(0, 5)}–{req.endTime.slice(0, 5)}
                      </span>
                      <Badge colour={req.roleColour ?? undefined}>{req.roleName}</Badge>
                      <span className="text-sm font-medium">×{req.minCount}</span>
                      {req.areaName && (
                        <span className="text-xs text-muted-foreground">{req.areaName}</span>
                      )}
                    </div>
                    {req.label && (
                      <p className="text-xs text-muted-foreground mt-0.5">{req.label}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => { setEditing(req); setDialogOpen(true); }}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(req.id)}
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

      {requirements.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No coverage requirements yet. Add one to define minimum staffing levels.
        </p>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
        title={editing ? "Edit requirement" : "Add requirement"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="covWeekday">Day</Label>
              <Select id="covWeekday" name="weekday" required defaultValue={editing?.weekday?.toString() ?? "0"}>
                {DAYS.map((d, i) => (
                  <option key={d} value={i}>{tr(d)}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="covMinCount">Min staff</Label>
              <Input
                id="covMinCount"
                name="minCount"
                type="number"
                min={1}
                defaultValue={editing?.minCount ?? 1}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="covStartTime">Start</Label>
              <Input
                id="covStartTime"
                name="startTime"
                type="time"
                defaultValue={editing?.startTime?.slice(0, 5) ?? "07:00"}
                required
              />
            </div>
            <div>
              <Label htmlFor="covEndTime">End</Label>
              <Input
                id="covEndTime"
                name="endTime"
                type="time"
                defaultValue={editing?.endTime?.slice(0, 5) ?? "15:00"}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="covRole">Role</Label>
            <Select id="covRole" name="roleId" required defaultValue={editing?.roleId ?? ""}>
              <option value="" disabled>Select role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </Select>
          </div>
          {areas.length > 0 && (
            <div>
              <Label htmlFor="covArea">{areaLabel}</Label>
              <Select id="covArea" name="areaId" defaultValue={editing?.areaId ?? ""}>
                <option value="">Any</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </Select>
            </div>
          )}
          <div>
            <Label htmlFor="covLabel">Label (optional)</Label>
            <Input id="covLabel" name="label" defaultValue={editing?.label ?? ""} />
          </div>
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
