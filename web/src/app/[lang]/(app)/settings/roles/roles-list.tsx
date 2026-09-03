"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Archive } from "lucide-react";
import { createRole, updateRole, archiveRole } from "./actions";

type Role = { id: string; name: string; colour: string | null; archived: boolean };

const PRESET_COLOURS = [
  "#0f766e", "#0e7490", "#7c3aed", "#c2410c",
  "#4f46e5", "#b91c1c", "#15803d", "#a16207",
  "#6d28d9", "#be185d", "#0369a1", "#9333ea",
];

export function RolesList({
  roles,
  orgId,
}: {
  roles: Role[];
  orgId: string;
}) {
  const tc = useTranslations("common");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [selectedColour, setSelectedColour] = useState(PRESET_COLOURS[0]);
  const [pending, startTransition] = useTransition();

  function openAdd() {
    setEditing(null);
    setSelectedColour(PRESET_COLOURS[0]);
    setDialogOpen(true);
  }

  function openEdit(role: Role) {
    setEditing(role);
    setSelectedColour(role.colour ?? PRESET_COLOURS[0]);
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("orgId", orgId);
    fd.set("colour", selectedColour);
    if (editing) fd.set("roleId", editing.id);
    startTransition(async () => {
      if (editing) await updateRole(fd);
      else await createRole(fd);
      setDialogOpen(false);
      setEditing(null);
    });
  }

  function handleArchive(roleId: string) {
    startTransition(() => {
      archiveRole(roleId);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Roles</h2>
        <Button variant="secondary" className="h-8 text-xs" onClick={openAdd}>
          <Plus size={14} /> {tc("add")}
        </Button>
      </div>

      <div className="space-y-2">
        {roles.map((role) => (
          <div
            key={role.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
          >
            <Badge colour={role.colour ?? undefined}>{role.name}</Badge>
            <div className="flex-1" />
            {role.archived && (
              <span className="text-xs text-muted-foreground">Archived</span>
            )}
            {!role.archived && (
              <div className="flex gap-1">
                <button
                  onClick={() => openEdit(role)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => handleArchive(role.id)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-danger hover:bg-accent transition"
                >
                  <Archive size={13} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
        title={editing ? "Edit role" : "Add role"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="roleName">Name</Label>
            <Input id="roleName" name="name" defaultValue={editing?.name ?? ""} required />
          </div>
          <div>
            <Label>Colour</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {PRESET_COLOURS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColour(c)}
                  className="h-7 w-7 rounded-full border-2 transition"
                  style={{
                    background: c,
                    borderColor: selectedColour === c ? "var(--foreground)" : "transparent",
                  }}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Input
                type="color"
                value={selectedColour}
                onChange={(e) => setSelectedColour(e.target.value)}
                className="h-8 w-12 p-0 border-0 cursor-pointer"
              />
              <span className="text-xs text-muted-foreground">{selectedColour}</span>
            </div>
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
