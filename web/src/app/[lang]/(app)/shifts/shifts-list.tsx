"use client";

import { useTranslations } from "next-intl";
import { useState, useMemo, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, X, Send, Mail, Search } from "lucide-react";
import { updateShift, cancelShift, assignShift } from "./actions";
import { blastShift } from "@/lib/offers/blast";
import { useRealtimeTable } from "@/lib/db/realtime";
import { CreatePatternDialog } from "./create-pattern-dialog";
import { EditPatternDialog, type PatternData } from "./edit-pattern-dialog";
import { PatternCard, type PatternWithCounts } from "./pattern-card";

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
  patternId: string | null;
  offerCount: number;
  offerPending: number;
  offerAccepted: number;
  offerDeclined: number;
};

type Role = { id: string; name: string; colour: string | null };
type Area = { id: string; name: string };
type Staff = { id: string; name: string };

type ViewTab = "patterns" | "oneOff";

export function ShiftsList({
  shifts,
  patterns,
  roles,
  areas,
  staff,
  siteId,
  areaLabel,
}: {
  shifts: Shift[];
  patterns: PatternWithCounts[];
  roles: Role[];
  areas: Area[];
  staff: Staff[];
  siteId: string;
  areaLabel: string;
}) {
  useRealtimeTable("shift", { column: "site_id", value: siteId });
  useRealtimeTable("shift_pattern", { column: "site_id", value: siteId });

  const t = useTranslations("shifts");
  const tc = useTranslations("common");
  const [viewTab, setViewTab] = useState<ViewTab>("patterns");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [patternStatusFilter, setPatternStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [editingPattern, setEditingPattern] = useState<PatternData | null>(null);
  const [expandedPatterns, setExpandedPatterns] = useState<Set<string>>(new Set());

  // Individual shift dialogs
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [assignDialog, setAssignDialog] = useState<Shift | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  // Orphan shifts = no pattern
  const orphanShifts = useMemo(
    () => shifts.filter((s) => !s.patternId && s.status !== "cancelled"),
    [shifts],
  );

  // Filtered patterns
  const filteredPatterns = useMemo(() => {
    let result = [...patterns];

    if (patternStatusFilter === "active") result = result.filter((p) => p.active && !(p.endDate && p.endDate < today));
    else if (patternStatusFilter === "paused") result = result.filter((p) => !p.active);
    else if (patternStatusFilter === "expired") result = result.filter((p) => p.endDate && p.endDate < today);

    if (roleFilter !== "all") result = result.filter((p) => p.roleId === roleFilter);
    if (areaFilter !== "all") result = result.filter((p) => p.areaId === areaFilter);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.roleName.toLowerCase().includes(q) ||
          p.areaName?.toLowerCase().includes(q) ||
          p.notes?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [patterns, patternStatusFilter, roleFilter, areaFilter, searchQuery, today]);

  // Filtered orphan shifts
  const filteredOrphans = useMemo(() => {
    let result = orphanShifts;
    if (roleFilter !== "all") result = result.filter((s) => s.roleId === roleFilter);
    if (areaFilter !== "all") result = result.filter((s) => s.areaId === areaFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.roleName.toLowerCase().includes(q) ||
          s.areaName?.toLowerCase().includes(q) ||
          s.assigneeName?.toLowerCase().includes(q) ||
          s.notes?.toLowerCase().includes(q) ||
          s.date.includes(q),
      );
    }
    return result;
  }, [orphanShifts, roleFilter, areaFilter, searchQuery]);

  function toggleExpand(id: string) {
    setExpandedPatterns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function shiftsForPattern(patternId: string) {
    return shifts
      .filter((s) => s.patternId === patternId && s.status !== "cancelled")
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  }

  function handleEditShift(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingShift) return;
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("siteId", siteId);
    fd.set("shiftId", editingShift.id);
    startTransition(async () => {
      const res = await updateShift(fd);
      if (res?.error) setError(res.error);
      else { setEditingShift(null); }
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

  function ShiftRow({ shift }: { shift: Shift }) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-border/50 bg-card p-2.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">{shift.date}</span>
            <span className="text-xs text-muted-foreground">
              {shift.startTime.slice(0, 5)}–{shift.endTime.slice(0, 5)}
            </span>
            <Badge colour={shift.roleColour ?? undefined}>{shift.roleName}</Badge>
            <Badge colour={statusColour(shift.status)}>{shift.status}</Badge>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
            {shift.areaName && <span>{shift.areaName}</span>}
            {shift.assigneeName && <span>· {shift.assigneeName}</span>}
            {shift.notes && <span>· {shift.notes}</span>}
            {shift.offerCount > 0 && (
              <span className="inline-flex items-center gap-1 text-primary">
                <Mail size={10} />
                {shift.offerPending > 0 && <span>{shift.offerPending} {t("pending")}</span>}
                {shift.offerAccepted > 0 && <span className="text-emerald-500">{shift.offerAccepted} {t("accepted")}</span>}
                {shift.offerDeclined > 0 && <span className="text-muted-foreground">{shift.offerDeclined} {t("declined")}</span>}
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
                >
                  <Send size={12} /> {t("blast")}
                </button>
                <button
                  onClick={() => setAssignDialog(shift)}
                  className="inline-flex h-7 px-2 items-center justify-center rounded-md text-xs text-primary hover:bg-accent transition"
                >
                  {t("assign")}
                </button>
              </>
            )}
            <button
              onClick={() => { setError(null); setEditingShift(shift); }}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => startTransition(() => { cancelShift(shift.id); })}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-danger hover:bg-accent transition"
            >
              <X size={13} />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">{t("title")}</h1>
          <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button variant="primary" className="h-8 text-xs" onClick={() => setCreateOpen(true)}>
          <Plus size={14} /> {t("createPattern")}
        </Button>
      </div>

      {/* View tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewTab("patterns")}
          className={`px-3 py-1 text-xs rounded-full border transition ${
            viewTab === "patterns"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("shiftPatterns")} ({patterns.length})
        </button>
        <button
          onClick={() => setViewTab("oneOff")}
          className={`px-3 py-1 text-xs rounded-full border transition ${
            viewTab === "oneOff"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("oneOffShifts")} ({orphanShifts.length})
        </button>
      </div>

      {/* Filters */}
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
        {viewTab === "patterns" && (
          <select
            value={patternStatusFilter}
            onChange={(e) => setPatternStatusFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-2.5 py-1.5 text-sm"
          >
            <option value="all">{tc("all")}</option>
            <option value="active">{t("activePattern")}</option>
            <option value="paused">{t("pausedPattern")}</option>
            <option value="expired">{t("expiredPattern")}</option>
          </select>
        )}
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
        {(searchQuery || roleFilter !== "all" || areaFilter !== "all" || patternStatusFilter !== "all") && (
          <button
            onClick={() => {
              setSearchQuery("");
              setRoleFilter("all");
              setAreaFilter("all");
              setPatternStatusFilter("all");
            }}
            className="text-xs text-primary hover:underline whitespace-nowrap"
          >
            {t("clearFilters")}
          </button>
        )}
      </div>

      {/* Pattern cards view */}
      {viewTab === "patterns" && (
        <div className="space-y-3">
          {filteredPatterns.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">{t("noPatterns")}</p>
          )}
          {filteredPatterns.map((pattern) => (
            <PatternCard
              key={pattern.id}
              pattern={pattern}
              expanded={expandedPatterns.has(pattern.id)}
              onToggleExpand={() => toggleExpand(pattern.id)}
              onEdit={() =>
                setEditingPattern({
                  id: pattern.id,
                  weekdays: pattern.weekdays,
                  startTime: pattern.startTime,
                  endTime: pattern.endTime,
                  startDate: pattern.startDate,
                  endDate: pattern.endDate,
                  minStaff: pattern.minStaff,
                  autoGenerate: pattern.autoGenerate,
                  roleId: pattern.roleId,
                  areaId: pattern.areaId,
                  notes: pattern.notes,
                })
              }
            >
              {shiftsForPattern(pattern.id).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">{tc("noResults")}</p>
              ) : (
                shiftsForPattern(pattern.id).map((shift) => (
                  <ShiftRow key={shift.id} shift={shift} />
                ))
              )}
            </PatternCard>
          ))}
        </div>
      )}

      {/* One-off shifts view */}
      {viewTab === "oneOff" && (
        <div className="space-y-2">
          {filteredOrphans.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">{tc("noResults")}</p>
          )}
          {filteredOrphans.map((shift) => (
            <ShiftRow key={shift.id} shift={shift} />
          ))}
        </div>
      )}

      {/* Create pattern dialog */}
      <CreatePatternDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        roles={roles}
        areas={areas}
        siteId={siteId}
        areaLabel={areaLabel}
      />

      {/* Edit pattern dialog */}
      {editingPattern && (
        <EditPatternDialog
          open={!!editingPattern}
          onClose={() => setEditingPattern(null)}
          pattern={editingPattern}
          roles={roles}
          areas={areas}
          siteId={siteId}
          areaLabel={areaLabel}
        />
      )}

      {/* Edit individual shift dialog */}
      <Dialog
        open={!!editingShift}
        onClose={() => setEditingShift(null)}
        title={t("editShift")}
      >
        {editingShift && (
          <form onSubmit={handleEditShift} className="space-y-4">
            {error && <p className="text-sm text-danger">{error}</p>}
            <div>
              <Label htmlFor="shiftDate">{t("date")}</Label>
              <input id="shiftDate" name="date" type="date" defaultValue={editingShift.date} required className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="esStartTime">{t("startTime")}</Label>
                <input id="esStartTime" name="startTime" type="time" defaultValue={editingShift.startTime.slice(0, 5)} required className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm" />
              </div>
              <div>
                <Label htmlFor="esEndTime">{t("endTime")}</Label>
                <input id="esEndTime" name="endTime" type="time" defaultValue={editingShift.endTime.slice(0, 5)} required className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm" />
              </div>
            </div>
            <div>
              <Label htmlFor="esRoleId">{t("role")}</Label>
              <Select id="esRoleId" name="roleId" required defaultValue={editingShift.roleId}>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </Select>
            </div>
            {areas.length > 0 && (
              <div>
                <Label htmlFor="esAreaId">{areaLabel}</Label>
                <Select id="esAreaId" name="areaId" defaultValue={editingShift.areaId ?? ""}>
                  <option value="">{tc("none")}</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="esNotes">{t("notes")}</Label>
              <input id="esNotes" name="notes" defaultValue={editingShift.notes ?? ""} className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditingShift(null)}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={pending}>
                {tc("save")}
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* Assign dialog */}
      <Dialog
        open={!!assignDialog}
        onClose={() => setAssignDialog(null)}
        title={`${t("assign")}: ${assignDialog?.roleName ?? ""}`}
      >
        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <Label htmlFor="staffId">{t("assignee")}</Label>
            <Select id="staffId" name="staffId" required>
              <option value="" disabled>{t("selectStaff")}</option>
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
