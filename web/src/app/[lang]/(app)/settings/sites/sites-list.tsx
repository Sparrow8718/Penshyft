"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Archive } from "lucide-react";
import { createSite, updateSite, archiveSite } from "./actions";

type Site = { id: string; name: string; address: string | null; archived: boolean };

export function SitesList({
  sites,
  orgId,
  orgPlan,
}: {
  sites: Site[];
  orgId: string;
  orgPlan: string;
}) {
  const tc = useTranslations("common");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Site | null>(null);
  const [pending, startTransition] = useTransition();

  const activeSites = sites.filter((s) => !s.archived);
  const canAddSite = orgPlan === "professional" || activeSites.length === 0;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("orgId", orgId);
    if (editing) fd.set("siteId", editing.id);
    startTransition(async () => {
      if (editing) await updateSite(fd);
      else await createSite(fd);
      setDialogOpen(false);
      setEditing(null);
    });
  }

  function handleArchive(siteId: string) {
    startTransition(() => archiveSite(siteId));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Sites</h2>
        {canAddSite && (
          <Button
            variant="secondary"
            className="h-8 text-xs"
            onClick={() => { setEditing(null); setDialogOpen(true); }}
          >
            <Plus size={14} /> {tc("add")}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {sites.map((site) => (
          <div
            key={site.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{site.name}</div>
              {site.address && (
                <div className="text-xs text-muted-foreground truncate">{site.address}</div>
              )}
            </div>
            {site.archived && <Badge>Archived</Badge>}
            {!site.archived && (
              <div className="flex gap-1">
                <button
                  onClick={() => { setEditing(site); setDialogOpen(true); }}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition"
                >
                  <Pencil size={13} />
                </button>
                {activeSites.length > 1 && (
                  <button
                    onClick={() => handleArchive(site.id)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-danger hover:bg-accent transition"
                  >
                    <Archive size={13} />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
        title={editing ? "Edit site" : "Add site"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="siteName">Name</Label>
            <Input id="siteName" name="name" defaultValue={editing?.name ?? ""} required />
          </div>
          <div>
            <Label htmlFor="siteAddress">Address</Label>
            <Input id="siteAddress" name="address" defaultValue={editing?.address ?? ""} />
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
