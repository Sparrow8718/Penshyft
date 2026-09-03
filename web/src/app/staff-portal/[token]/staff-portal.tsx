"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Calendar } from "lucide-react";
import { requestSwap } from "./actions";

type ShiftItem = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  roleName: string;
  areaName: string | null;
  hasPendingSwap: boolean;
};

export function StaffPortal({
  staffId,
  staffToken,
  shifts,
}: {
  staffId: string;
  staffToken: string;
  shifts: ShiftItem[];
}) {
  const [swapShiftId, setSwapShiftId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleRequestSwap(shiftId: string) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await requestSwap(shiftId, staffToken, reason);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess("Swap request submitted. Your manager will review it.");
        setSwapShiftId(null);
        setReason("");
      }
    });
  }

  const calendarUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/calendar/${staffToken}`
    : `/api/calendar/${staffToken}`;

  const webcalUrl = calendarUrl.replace(/^https?:/, "webcal:");

  if (shifts.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground py-8 text-center">
          No upcoming shifts.
        </p>
        <CalendarSubscribe webcalUrl={webcalUrl} calendarUrl={calendarUrl} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-danger">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}

      {shifts.map((shift) => (
        <div
          key={shift.id}
          className="rounded-lg border border-border bg-card p-4 space-y-2"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">{shift.date}</div>
              <div className="text-xs text-muted-foreground">
                {shift.startTime}–{shift.endTime}
                {shift.roleName && <> &middot; {shift.roleName}</>}
                {shift.areaName && <> &middot; {shift.areaName}</>}
              </div>
            </div>
            {shift.hasPendingSwap ? (
              <Badge className="bg-amber-500/10 text-amber-600">Swap pending</Badge>
            ) : (
              <Button
                variant="ghost"
                className="h-7 text-xs"
                onClick={() =>
                  setSwapShiftId(swapShiftId === shift.id ? null : shift.id)
                }
              >
                <ArrowLeftRight size={13} /> Request swap
              </Button>
            )}
          </div>

          {swapShiftId === shift.id && (
            <div className="space-y-2 pt-2 border-t border-border">
              <input
                type="text"
                placeholder="Reason (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="h-7 text-xs"
                  disabled={pending}
                  onClick={() => handleRequestSwap(shift.id)}
                >
                  Submit request
                </Button>
                <Button
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => { setSwapShiftId(null); setReason(""); }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
      <CalendarSubscribe webcalUrl={webcalUrl} calendarUrl={calendarUrl} />
    </div>
  );
}

function CalendarSubscribe({ webcalUrl, calendarUrl }: { webcalUrl: string; calendarUrl: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Calendar size={14} className="text-primary" />
        Subscribe to calendar
      </div>
      <p className="text-xs text-muted-foreground">
        Add your shifts to your phone or desktop calendar.
      </p>
      <div className="flex gap-2">
        <a
          href={webcalUrl}
          className="flex-1 rounded-md bg-primary py-2 text-center text-xs font-medium text-primary-foreground hover:bg-primary/90 transition"
        >
          Subscribe
        </a>
        <button
          onClick={() => {
            navigator.clipboard.writeText(calendarUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-muted transition"
        >
          {copied ? "Copied!" : "Copy URL"}
        </button>
      </div>
    </div>
  );
}
