"use client";

import { useTranslations } from "next-intl";
import { useState, useMemo, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, X, Send, Mail, Search } from "lucide-react";
import { createShift, updateShift, cancelShift, assignShift } from "./actions";
import { blastShift } from "@/lib/offers/blast";
import { useRealtimeTable } from "@/lib/db/realtime";

type Shift = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "open" | "filled" | "cancelled";
  notes: string | null;
  roleId: string;
  roleName: string;
  roleColour: string | null;
  areaId: string | null;
  areaName: string | null;
  filledBy: string | null;
  assigneeName: string | null;
  offerCount: number;
  offerPending: number;
  offerAccepted: number;
  offerDeclined: number;
};

type Role = { id: string; name: string; colour: string | null };
type Area = { id: string; name: string };
type Staff = { id: string; name: string };

export function ShiftsList({
  shifts,
  roles,
  areas,
  staff,
  siteId,
  areaLabel,
}: {
  shifts: Shift[];
  roles: Role[];
  areas: Area[];
  staff: Staff[];
  siteId: string;
  areaLabel: string;
}) {
  useRealtimeTable("shift", { column: "site_id", value: siteId });

  const t = useTranslations("shifts");
  const tc = useTranslations("common");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);
  const [assignDialog, setAssignDialog] = useState<Shift | null>(null);
  const [pending, startTransition] = useTransition();

  const hasFilters = searchQuery || roleFilter !== "all" || areaFilter !== "all" || dateFrom || dateTo;

  const filtered = useMemo(() => {
    let result = statusFilter === "all"
      ? shifts.filter((s) => s.status !== "cancelled")
      : shifts.filter((s) => s.status === statusFilter);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.roleName.toLowerCase().includes(q) ||
          (s.areaName?.toLowerCase().includes(q)) ||
          (s.assigneeName?.toLowerCase().includes(q)) ||
          (s.notes?.toLowerCase().includes(q)) ||
          s.date.includes(q),
      );
    }

    if (roleFilter !== "all") {
      result = result.filter((s) => s.roleId === roleFilter);
    }

    if (areaFilter !== "all") {
      result = result.filter((s) => s.areaId === areaFilter);
    }

    if (dateFrom) {
      result = result.filter((s) => s.date >= dateFrom);
    }

    if (dateTo) {
      result = result.filter((s) => s.date <= dateTo);
    }

    return result;
  }, [shifts, statusFilter, searchQuery, roleFilter, areaFilter, dateFrom, dateTo]);

  function clearFilters() {
    setSearchQuery("");
    setRoleFilter("all");
    setAreaFilter("all");
    setDateFrom("");
    setDateTo("");
  }

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(shift: Shift) {
    setEditing(shift);
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("siteId", siteId);
    if (editing) fd.set("shiftId", editing.id);
    startTransition(async () => {
      if (editing) await updateShift(fd);
      else await createShift(fd);
      setDialogOpen(false);
      setEditing(null);
    });
  }

  function handleCancel(shiftId: string) {
    startTransition(() => {
      cancelShift(shiftId);
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
    });
  }

  const statusColour = (s: string) => {
    if (s === "filled") return "#15803d";
    if (s === "cancelled") return "#6b7280";
    return "#c2410c";
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">{t("title")}</h1>
          <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button variant="primary" className="h-8 text-xs" onClick={openAdd}>
          <Plus size={14} /> {t("postShift")}
        </Button>
      </div>

      <div className="flex gap-2">
        {["all", "open", "filled", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 text-xs rounded-full border transition ${
              statusFilter === s
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "all" ? "All" : t(s as "open" | "cancelled")}
          </button>
        ))}
      </div>

      {/* Search & filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-input bg-background pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-2.5 py-1.5 text-sm"
        >
          <option value="all">{t("allRoles")}</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        {areas.length > 0 && (
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-2.5 py-1.5 text-sm"
          >
            <option value="all">{t("allAreas")}</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        )}
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="rounded-md border border-input bg-background px-2.5 py-1.5 text-sm"
          title="From date"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="rounded-md border border-input bg-background px-2.5 py-1.5 text-sm"
          title="To date"
        />
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-primary hover:underline whitespace-nowrap"
          >
            {t("clearFilters")}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {tc("noResults")}
          </p>
        )}
        {filtered.map((shift) => (
          <div
            key={shift.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{shift.date}</span>
                <span className="text-xs text-muted-foreground">
                  {shift.startTime.slice(0, 5)}–{shift.endTime.slice(0, 5)}
                </span>
                <Badge colour={shift.roleColour ?? undefined}>{shift.roleName}</Badge>
                <Badge colour={statusColour(shift.status)}>{shift.status}</Badge>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                {shift.areaName && <span>{shift.areaName}</span>}
                {shift.assigneeName && <span>· {shift.assigneeName}</span>}
                {shift.notes && <span>· {shift.notes}</span>}
                {shift.offerCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-primary">
                    <Mail size={10} />
                    {shift.offerPending > 0 && <span>{shift.offerPending} pending</span>}
                    {shift.offerAccepted > 0 && <span className="text-emerald-500">{shift.offerAccepted} accepted</span>}
                    {shift.offerDeclined > 0 && <span className="text-muted-foreground">{shift.offerDeclined} declined</span>}
                  </span>
                )}
              </div>
            </div>
            {shift.status !== "cancelled" && (
              <div className="flex gap-1 shrink-0">
                {shift.status === "open" && (
                  <>
                    <button
                      onClick={() => startTransition(async () => { await blastShift(shift.id); })}
                      className="inline-flex h-7 px-2 items-center gap-1 justify-center rounded-md text-xs text-primary hover:bg-accent transition"
                      title="Send to qualified staff"
                    >
                      <Send size={12} /> Blast
                    </button>
                    <button
                      onClick={() => setAssignDialog(shift)}
                      className="inline-flex h-7 px-2 items-center justify-center rounded-md text-xs text-primary hover:bg-accent transition"
                    >
                      Assign
                    </button>
                  </>
                )}
                <button
                  onClick={() => openEdit(shift)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => handleCancel(shift.id)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-danger hover:bg-accent transition"
                >
                  <X size={13} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create / Edit shift dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
        title={editing ? t("editShift") : t("postShift")}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="shiftDate">{t("date")}</Label>
            <Input
              id="shiftDate"
              name="date"
              type="date"
              defaultValue={editing?.date ?? today}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="startTime">{t("startTime")}</Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                defaultValue={editing?.startTime?.slice(0, 5) ?? "09:00"}
                required
              />
            </div>
            <div>
              <Label htmlFor="endTime">{t("endTime")}</Label>
              <Input
                id="endTime"
                name="endTime"
                type="time"
                defaultValue={editing?.endTime?.slice(0, 5) ?? "17:00"}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="roleId">{t("role")}</Label>
            <Select id="roleId" name="roleId" required defaultValue={editing?.roleId ?? ""}>
              <option value="" disabled>Select role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </Select>
          </div>
          {areas.length > 0 && (
            <div>
              <Label htmlFor="areaId">{areaLabel}</Label>
              <Select id="areaId" name="areaId" defaultValue={editing?.areaId ?? ""}>
                <option value="">None</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </Select>
            </div>
          )}
          <div>
            <Label htmlFor="shiftNotes">Notes</Label>
            <Input id="shiftNotes" name="notes" defaultValue={editing?.notes ?? ""} />
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

      {/* Assign dialog */}
      <Dialog
        open={!!assignDialog}
        onClose={() => setAssignDialog(null)}
        title={`Assign: ${assignDialog?.roleName ?? ""}`}
      >
        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <Label htmlFor="staffId">{t("assignee")}</Label>
            <Select id="staffId" name="staffId" required>
              <option value="" disabled>Select staff</option>
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
