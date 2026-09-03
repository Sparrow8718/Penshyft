"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useState, useTransition, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Archive, Search, UserX, UserCheck, Upload, Calendar } from "lucide-react";
import {
  createStaff,
  updateStaff,
  archiveStaff,
  toggleStaffActive,
  assignRoles,
  assignAreas,
} from "./actions";

type RoleRef = { role_id: string; name: string; colour: string | null };
type AreaRef = { area_id: string; name: string };

type StaffMember = {
  id: string;
  name: string;
  email: string | null;
  mobile: string | null;
  notes: string | null;
  active: boolean;
  archived: boolean;
  roles: RoleRef[];
  areas: AreaRef[];
};

type AvailableRole = { id: string; name: string; colour: string | null };
type AvailableArea = { id: string; name: string };

const FREE_CAP = 15;

export function StaffList({
  staff,
  roles,
  areas,
  orgId,
  orgPlan,
  areaLabel,
  activeCount,
}: {
  staff: StaffMember[];
  roles: AvailableRole[];
  areas: AvailableArea[];
  orgId: string;
  orgPlan: string;
  areaLabel: string;
  activeCount: number;
}) {
  const t = useTranslations("staff");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (!query) return staff.filter((s) => !s.archived);
    const q = query.toLowerCase();
    return staff.filter(
      (s) =>
        !s.archived &&
        (s.name.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.mobile?.includes(q)),
    );
  }, [staff, query]);

  const atCap = orgPlan === "free" && activeCount >= FREE_CAP;

  function openAdd() {
    setEditing(null);
    setSelectedRoles([]);
    setSelectedAreas([]);
    setDialogOpen(true);
  }

  function openEdit(member: StaffMember) {
    setEditing(member);
    setSelectedRoles(member.roles.map((r) => r.role_id));
    setSelectedAreas(member.areas.map((a) => a.area_id));
    setDialogOpen(true);
  }

  function toggleRole(id: string) {
    setSelectedRoles((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );
  }

  function toggleArea(id: string) {
    setSelectedAreas((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("orgId", orgId);
    startTransition(async () => {
      if (editing) {
        fd.set("staffId", editing.id);
        await updateStaff(fd);
        await assignRoles(editing.id, selectedRoles);
        await assignAreas(editing.id, selectedAreas);
      } else {
        const result = await createStaff(fd);
        if (result?.staffId) {
          await assignRoles(result.staffId, selectedRoles);
          await assignAreas(result.staffId, selectedAreas);
        }
      }
      setDialogOpen(false);
      setEditing(null);
    });
  }

  function handleArchive(id: string) {
    startTransition(() => archiveStaff(id));
  }

  function handleToggleActive(id: string, active: boolean) {
    startTransition(() => toggleStaffActive(id, !active));
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">{t("title")}</h1>
          <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/${locale}/staff/availability`}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition"
          >
            <Calendar size={14} /> Availability
          </Link>
          <Link
            href={`/${locale}/staff/import`}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition"
          >
            <Upload size={14} /> {t("csvImport")}
          </Link>
          <Button
            variant="primary"
            className="h-8 text-xs"
            onClick={openAdd}
            disabled={atCap}
            title={atCap ? `Free plan: max ${FREE_CAP} active staff` : undefined}
          >
            <Plus size={14} /> {t("addStaff")}
          </Button>
        </div>
      </div>

      {orgPlan === "free" && (
        <p className="text-xs text-muted-foreground">
          {activeCount}/{FREE_CAP} active staff (free plan)
        </p>
      )}

      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tc("search")}
          className="pl-8 h-8 text-sm"
        />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {tc("noResults")}
          </p>
        )}
        {filtered.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
          >
            <Link href={`/${locale}/staff/${member.id}`} className="flex-1 min-w-0 hover:opacity-80 transition">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{member.name}</span>
                {!member.active && (
                  <span className="text-[10px] text-muted-foreground uppercase">
                    Inactive
                  </span>
                )}
              </div>
              {(member.email || member.mobile) && (
                <p className="text-xs text-muted-foreground truncate">
                  {[member.email, member.mobile].filter(Boolean).join(" · ")}
                </p>
              )}
              {member.roles.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {member.roles.map((r) => (
                    <Badge key={r.role_id} colour={r.colour ?? undefined}>
                      {r.name}
                    </Badge>
                  ))}
                </div>
              )}
            </Link>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => handleToggleActive(member.id, member.active)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition"
                title={member.active ? "Deactivate" : "Activate"}
              >
                {member.active ? <UserX size={13} /> : <UserCheck size={13} />}
              </button>
              <button
                onClick={() => openEdit(member)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => handleArchive(member.id)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-danger hover:bg-accent transition"
              >
                <Archive size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        title={editing ? t("editStaff") : t("addStaff")}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="staffName">{t("title")}</Label>
            <Input
              id="staffName"
              name="name"
              defaultValue={editing?.name ?? ""}
              required
              placeholder="Jane Smith"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="staffEmail">{t("mobile")}</Label>
              <Input
                id="staffMobile"
                name="mobile"
                defaultValue={editing?.mobile ?? ""}
                placeholder="+44 7..."
              />
            </div>
            <div>
              <Label htmlFor="staffEmail">Email</Label>
              <Input
                id="staffEmail"
                name="email"
                type="email"
                defaultValue={editing?.email ?? ""}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="staffNotes">{t("notes")}</Label>
            <Input
              id="staffNotes"
              name="notes"
              defaultValue={editing?.notes ?? ""}
            />
          </div>

          {roles.length > 0 && (
            <div>
              <Label>{t("roles")}</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => toggleRole(role.id)}
                    className="transition"
                  >
                    <Badge
                      colour={role.colour ?? undefined}
                      className={
                        selectedRoles.includes(role.id)
                          ? "ring-2 ring-primary ring-offset-1"
                          : "opacity-40"
                      }
                    >
                      {role.name}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          {areas.length > 0 && (
            <div>
              <Label>{areaLabel}s</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {areas.map((area) => (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => toggleArea(area.id)}
                    className="transition"
                  >
                    <Badge
                      className={
                        selectedAreas.includes(area.id)
                          ? "ring-2 ring-primary ring-offset-1"
                          : "opacity-40"
                      }
                    >
                      {area.name}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDialogOpen(false)}
            >
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
