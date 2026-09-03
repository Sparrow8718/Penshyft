import { cn } from "@/lib/utils";
import { CheckCircle2, Radio, AlertTriangle } from "lucide-react";

type Status = "filled" | "open" | "at_risk";

type Props = {
  role: string;
  time: string;
  status: Status;
  who: string | null;
};

const STATUS: Record<Status, { label: string; className: string; Icon: React.ComponentType<{ size?: number }> }> = {
  filled:  { label: "Filled",  className: "bg-success/10 text-success border-success/20",  Icon: CheckCircle2 },
  open:    { label: "Open",    className: "bg-warning/10 text-warning border-warning/20",  Icon: Radio },
  at_risk: { label: "At risk", className: "bg-danger/10 text-danger border-danger/20",     Icon: AlertTriangle },
};

export function ShiftCard({ role, time, status, who }: Props) {
  const s = STATUS[status];
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
      <div className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        s.className,
      )}>
        <s.Icon size={12} />
        {s.label}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{role} · {time}</div>
        <div className="text-xs text-muted-foreground">
          {who ? `Assigned to ${who}` : "No one assigned yet"}
        </div>
      </div>
      {status !== "filled" && (
        <button className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition">
          Blast to eligible staff
        </button>
      )}
    </div>
  );
}
