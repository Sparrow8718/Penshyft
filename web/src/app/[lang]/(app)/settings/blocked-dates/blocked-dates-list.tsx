"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, CalendarOff } from "lucide-react";
import { addBlockedDate, removeBlockedDate } from "./actions";

type BlockedDate = {
  id: string;
  date: string;
  reason: string | null;
};

export function BlockedDatesList({
  blockedDates,
  siteId,
}: {
  blockedDates: BlockedDate[];
  siteId: string;
}) {
  const t = useTranslations("blockedDates");
  const tc = useTranslations("common");
  const [showForm, setShowForm] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("siteId", siteId);
    startTransition(async () => {
      const res = await addBlockedDate(fd);
      if (res?.error) setError(res.error);
      else setShowForm(false);
    });
  }

  function handleRemove(id: string) {
    startTransition(() => {
      removeBlockedDate(id);
    });
  }

  const sorted = [...blockedDates].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">{t("title")}</h2>
          <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button
          variant="secondary"
          className="h-8 text-xs"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={14} /> {tc("add")}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-4 space-y-3">
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="bdDate">{t("date")}</Label>
              <Input id="bdDate" name="date" type="date" required />
            </div>
            <div>
              <Label htmlFor="bdReason">{t("reason")}</Label>
              <Input id="bdReason" name="reason" placeholder={t("reasonPlaceholder")} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={pending}>
              {tc("save")}
            </Button>
          </div>
        </form>
      )}

      {sorted.length === 0 && !showForm && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <CalendarOff size={24} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        </div>
      )}

      {sorted.length > 0 && (
        <div className="space-y-2">
          {sorted.map((bd) => (
            <div
              key={bd.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
            >
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">{bd.date}</span>
                {bd.reason && (
                  <span className="text-xs text-muted-foreground ml-2">— {bd.reason}</span>
                )}
              </div>
              <button
                onClick={() => handleRemove(bd.id)}
                disabled={pending}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-danger hover:bg-accent transition"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
