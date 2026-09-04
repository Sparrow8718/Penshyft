"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { approveRequest, denyRequest } from "./actions";

type RequestItem = {
  id: string;
  request_type: string;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  weekday: number | null;
  reason: string | null;
  status: string;
  created_at: string;
  staff_name: string;
};

const WEEKDAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function RequestsList({ requests }: { requests: RequestItem[] }) {
  const t = useTranslations("staff");
  const [pending, startTransition] = useTransition();
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});

  function handleApprove(id: string) {
    startTransition(async () => {
      await approveRequest(id, noteMap[id]);
    });
  }

  function handleDeny(id: string) {
    startTransition(async () => {
      await denyRequest(id, noteMap[id]);
    });
  }

  if (requests.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        {t("noRequests")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <div
          key={req.id}
          className="rounded-lg border border-border bg-card p-4 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">{req.staff_name}</span>
            <Badge className={
              req.request_type === "day_off" ? "bg-blue-500/10 text-blue-600" :
              req.request_type === "hours_limit" ? "bg-purple-500/10 text-purple-600" :
              "bg-teal-500/10 text-teal-600"
            }>
              {req.request_type === "day_off" ? t("dayOff") :
               req.request_type === "hours_limit" ? t("hoursLimit") : t("recurring")}
            </Badge>
          </div>

          <div className="text-xs text-muted-foreground space-y-0.5">
            {req.date && <div>{req.date}</div>}
            {req.start_time && req.end_time && (
              <div>{req.start_time}–{req.end_time}</div>
            )}
            {req.weekday != null && <div>{WEEKDAY_LABELS[req.weekday]}</div>}
            {req.reason && <div>{req.reason}</div>}
            <div className="text-[10px]">{new Date(req.created_at).toLocaleDateString()}</div>
          </div>

          <div className="space-y-2 pt-2 border-t border-border">
            <input
              type="text"
              placeholder={t("managerNote")}
              value={noteMap[req.id] ?? ""}
              onChange={(e) => setNoteMap((prev) => ({ ...prev, [req.id]: e.target.value }))}
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="h-7 text-xs"
                disabled={pending}
                onClick={() => handleApprove(req.id)}
              >
                <Check size={13} /> {t("approve")}
              </Button>
              <Button
                variant="ghost"
                className="h-7 text-xs text-danger"
                disabled={pending}
                onClick={() => handleDeny(req.id)}
              >
                <X size={13} /> {t("deny")}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
