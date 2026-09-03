import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";

type Props = {
  role: string;
  colour: string;
  filled: number;
  needed: number;
};

export function CoverageBar({ role, colour, filled, needed }: Props) {
  const pct = Math.min(100, Math.round((filled / Math.max(needed, 1)) * 100));
  const state = filled >= needed ? "ok" : filled === 0 ? "critical" : "at_risk";
  const Icon = state === "ok" ? CheckCircle2 : state === "critical" ? AlertCircle : AlertTriangle;
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: colour }}
        />
        <div className="text-sm font-medium">{role}</div>
        <div className={cn(
          "ml-auto inline-flex items-center gap-1 text-xs font-medium",
          state === "ok" && "text-success",
          state === "at_risk" && "text-warning",
          state === "critical" && "text-danger",
        )}>
          <Icon size={14} />
          {filled}/{needed}
        </div>
      </div>
      <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full transition-all",
            state === "ok" && "bg-success",
            state === "at_risk" && "bg-warning",
            state === "critical" && "bg-danger",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
