"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Pencil, Pause, Play, RefreshCw, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { toggleShiftPattern, deleteShiftPattern, generateShiftsNow } from "./pattern-actions";

const DAY_KEYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export type PatternWithCounts = {
  id: string;
  weekdays: number[];
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string | null;
  minStaff: number;
  autoGenerate: boolean;
  active: boolean;
  roleId: string;
  roleName: string;
  roleColour: string | null;
  areaId: string | null;
  areaName: string | null;
  notes: string | null;
  lastGeneratedTo: string | null;
  totalShifts: number;
  openShifts: number;
  filledShifts: number;
};

function weekdaySummary(weekdays: number[]): string {
  const sorted = [...weekdays].sort();
  if (sorted.length === 7) return "Every day";
  if (sorted.length === 5 && sorted.every((d, i) => d === i)) return "Mon–Fri";
  if (sorted.length === 2 && sorted[0] === 5 && sorted[1] === 6) return "Sat–Sun";
  return sorted.map((d) => DAY_KEYS[d]).join(", ");
}

export function PatternCard({
  pattern,
  expanded,
  onToggleExpand,
  onEdit,
  children,
}: {
  pattern: PatternWithCounts;
  expanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  children?: React.ReactNode;
}) {
  const t = useTranslations("shifts");
  const tc = useTranslations("common");
  const [pending, startTransition] = useTransition();

  const fillRate =
    pattern.totalShifts > 0
      ? Math.round((pattern.filledShifts / pattern.totalShifts) * 100)
      : 0;

  const isExpired = pattern.endDate && pattern.endDate < new Date().toISOString().slice(0, 10);
  const statusLabel = !pattern.active
    ? t("pausedPattern")
    : isExpired
      ? t("expiredPattern")
      : t("activePattern");
  const statusColour = !pattern.active
    ? "#6b7280"
    : isExpired
      ? "#9ca3af"
      : "#15803d";

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <Badge colour={pattern.roleColour ?? undefined}>{pattern.roleName}</Badge>
            <span className="text-sm font-medium">{weekdaySummary(pattern.weekdays)}</span>
            <span className="text-xs text-muted-foreground">
              {pattern.startTime.slice(0, 5)}–{pattern.endTime.slice(0, 5)}
            </span>
            {pattern.minStaff > 1 && (
              <span className="text-xs text-muted-foreground">×{pattern.minStaff}</span>
            )}
          </div>
          <Badge colour={statusColour}>{statusLabel}</Badge>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span>
            {pattern.startDate}
            {pattern.endDate ? ` → ${pattern.endDate}` : ` → ${t("ongoing")}`}
          </span>
          {pattern.areaName && <span>· {pattern.areaName}</span>}
          {pattern.autoGenerate && (
            <span className="text-primary font-medium">{t("autoGenerate")}: ON</span>
          )}
        </div>

        {pattern.totalShifts > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-accent overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${fillRate}%`,
                  backgroundColor: fillRate >= 80 ? "#15803d" : fillRate >= 50 ? "#ca8a04" : "#c2410c",
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {pattern.filledShifts}/{pattern.totalShifts} {t("filled")} ({fillRate}%)
            </span>
          </div>
        )}

        <div className="flex items-center gap-1 pt-1">
          <button
            onClick={onEdit}
            disabled={pending}
            className="inline-flex h-7 px-2 items-center gap-1 justify-center rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition"
          >
            <Pencil size={12} /> {tc("edit")}
          </button>
          <button
            onClick={() => startTransition(async () => { await toggleShiftPattern(pattern.id); })}
            disabled={pending}
            className="inline-flex h-7 px-2 items-center gap-1 justify-center rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition"
          >
            {pattern.active ? <Pause size={12} /> : <Play size={12} />}
            {pattern.active ? t("pausePattern") : t("resumePattern")}
          </button>
          {pattern.active && (
            <button
              onClick={() => startTransition(async () => { await generateShiftsNow(pattern.id); })}
              disabled={pending}
              className="inline-flex h-7 px-2 items-center gap-1 justify-center rounded-md text-xs text-primary hover:bg-accent transition"
            >
              <RefreshCw size={12} /> {t("generateNow")}
            </button>
          )}
          <button
            onClick={() => {
              if (confirm(t("deletePattern") + "?")) {
                startTransition(async () => { await deleteShiftPattern(pattern.id); });
              }
            }}
            disabled={pending}
            className="inline-flex h-7 px-2 items-center gap-1 justify-center rounded-md text-xs text-muted-foreground hover:text-danger hover:bg-accent transition"
          >
            <Trash2 size={12} />
          </button>
          <div className="flex-1" />
          <button
            onClick={onToggleExpand}
            className="inline-flex h-7 px-2 items-center gap-1 justify-center rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? t("hideShifts") : t("showShifts")}
          </button>
        </div>
      </div>

      {expanded && children && (
        <div className="border-t border-border bg-background p-3 space-y-1.5">
          {children}
        </div>
      )}
    </div>
  );
}

