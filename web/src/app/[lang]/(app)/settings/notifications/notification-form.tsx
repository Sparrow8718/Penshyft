"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { updateNotificationPrefs, type NotifCategory } from "./actions";

const CATEGORIES: NotifCategory[] = [
  "shift_offer",
  "swap_request",
  "swap_resolved",
  "team_invite",
];

type Props = {
  prefs: Record<string, boolean>;
};

export function NotificationForm({ prefs }: Props) {
  const t = useTranslations("notificationPrefs");
  const [state, setState] = useState<Record<string, boolean>>(prefs);
  const [isPending, startTransition] = useTransition();

  function toggle(category: NotifCategory) {
    const next = { ...state, [category]: !state[category] };
    setState(next);
    startTransition(async () => {
      await updateNotificationPrefs(
        CATEGORIES.map((c) => ({
          category: c,
          enabled: next[c] ?? true,
        })),
      );
    });
  }

  return (
    <div className="space-y-4">
      {CATEGORIES.map((cat) => {
        const enabled = state[cat] ?? true;
        return (
          <div
            key={cat}
            className="flex items-center justify-between rounded-lg border border-border p-4"
          >
            <div>
              <div className="text-sm font-medium">{t(cat)}</div>
              <div className="text-xs text-muted-foreground">
                {t(`${cat}_desc`)}
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              disabled={isPending}
              onClick={() => toggle(cat)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${
                enabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                  enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
