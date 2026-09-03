import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  subtext,
  icon,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-semibold">{value}</p>
      {subtext && <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>}
    </div>
  );
}
