"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Archive, ArchiveRestore } from "lucide-react";
import { createArea, updateArea, archiveArea, unarchiveArea } from "./actions";

type Area = { id: string; name: string; archived: boolean; site_id: string };
type Site = { id: string; name: string };

export function AreasList({
  areas,
  sites,
  areaLabel,
}: {
  areas: Area[];
  sites: Site[];
  areaLabel: string;
}) {
  const tc = useTranslations("common");
  const ta = useTranslations("areas");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Area | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Area | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (editing) fd.set("areaId", editing.id);
    startTransition(async () => {
      if (editing) await updateArea(fd);
      else await createArea(fd);
      setDialogOpen(false);
      setEditing(null);
    });
  }

  function confirmArchive() {
    if (!archiveTarget) return;
    startTransition(async () => {
      await archiveArea(archiveTarget.id);
      setArchiveTarget(null);
    });
  }

  function handleUnarchive(areaId: string) {
    startTransition(() => {
      unarchiveArea(areaId);
    });
  }

  const grouped = sites.map((site) => ({
    site,
    areas: areas.filter((a) => a.site_id === site.id),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{areaLabel}s</h2>
        <Button
          variant="secondary"
          className="h-8 text-xs"
          onClick={() => { setEditing(null); setDialogOpen(true); }}
        >
          <Plus size={14} /> {tc("add")}
        </Button>
      </div>

      {grouped.map(({ site, areas: siteAreas }) => (
        <div key={site.id}>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {site.name}
          </h3>
          <div className="space-y-2">
            {siteAreas.length === 0 && (
              <p className="text-xs text-muted-foreground">No {areaLabel.toLowerCase()}s yet.</p>
            )}
            {siteAreas.map((area) => (
              <div
                key={area.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div className="flex-1 text-sm font-medium">{area.name}</div>
                {area.archived && <Badge>Archived</Badge>}
                {area.archived && (
                  <button
                    onClick={() => handleUnarchive(area.id)}
                    title={ta("unarchive")}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition"
                  >
                    <ArchiveRestore size={13} />
                  </button>
                )}
                {!area.archived && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditing(area); setDialogOpen(true); }}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setArchiveTarget(area)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-danger hover:bg-accent transition"
                    >
                      <Archive size={13} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <Dialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
        title={editing ? `Edit ${areaLabel.toLowerCase()}` : `Add ${areaLabel.toLowerCase()}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editing && sites.length > 1 && (
            <div>
              <Label htmlFor="siteId">Site</Label>
              <Select id="siteId" name="siteId" required>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </div>
          )}
          {!editing && sites.length === 1 && (
            <input type="hidden" name="siteId" value={sites[0].id} />
          )}
          <div>
            <Label htmlFor="areaName">Name</Label>
            <Input id="areaName" name="name" defaultValue={editing?.name ?? ""} required />
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

      <Dialog
        open={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        title={ta("archiveConfirm", { name: archiveTarget?.name ?? "" })}
      >
        <p className="text-sm text-muted-foreground">
          {ta("archiveConfirmDesc")}
        </p>
        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="ghost" onClick={() => setArchiveTarget(null)}>
            {tc("cancel")}
          </Button>
          <Button variant="danger" disabled={pending} onClick={confirmArchive}>
            {tc("confirm")}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
