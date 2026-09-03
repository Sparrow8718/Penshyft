"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CalendarClock,
  Users,
  Settings,
  Sparkles,
  Send,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type Entry = {
  id: string;
  actor: string;
  action: string;
  entity: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
};

const ACTION_ICONS: Record<string, typeof CalendarClock> = {
  "shift": CalendarClock,
  "staff": Users,
  "rota": Sparkles,
  "offers": Send,
};

function getIcon(action: string) {
  const prefix = action.split(".")[0];
  return ACTION_ICONS[prefix] ?? Settings;
}

function timeAgo(dateStr: string, locale: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(dateStr).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
}

export function ActivityFeed({
  entries,
  page,
  totalPages,
  locale,
}: {
  entries: Entry[];
  page: number;
  totalPages: number;
  locale: string;
}) {
  const t = useTranslations("activity");

  if (entries.length === 0 && page === 1) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center text-sm text-muted-foreground">
        {t("noActivity")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        {entries.map((entry) => {
          const Icon = getIcon(entry.action);
          const actionKey = entry.action.replace(".", "_");
          let label: string;
          try {
            label = t(actionKey as never);
          } catch {
            label = entry.action;
          }

          return (
            <div
              key={entry.id}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
            >
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-accent text-muted-foreground">
                <Icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{entry.actor}</span>{" "}
                  <span className="text-muted-foreground">{label}</span>
                </p>
                {entry.meta && Object.keys(entry.meta).length > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {Object.entries(entry.meta)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(" · ")}
                  </p>
                )}
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {timeAgo(entry.createdAt, locale)}
              </span>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link href={`/${locale}/activity?page=${page - 1}`}>
              <Button variant="ghost" className="h-8">
                <ChevronLeft size={14} />
              </Button>
            </Link>
          )}
          <span className="text-xs text-muted-foreground">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/${locale}/activity?page=${page + 1}`}>
              <Button variant="ghost" className="h-8">
                <ChevronRight size={14} />
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
