"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { requestSwap, submitAvailabilityRequest } from "./actions";

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

type AvailabilityRequestItem = {
  id: string;
  request_type: string;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  weekday: number | null;
  reason: string | null;
  status: string;
  created_at: string;
};

const WEEKDAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function StaffPortal({
  staffId,
  staffToken,
  shifts,
  availabilityRequests,
}: {
  staffId: string;
  staffToken: string;
  shifts: ShiftItem[];
  availabilityRequests: AvailabilityRequestItem[];
}) {
  const [swapShiftId, setSwapShiftId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [showAvailForm, setShowAvailForm] = useState(false);
  const [reqType, setReqType] = useState<"day_off" | "hours_limit" | "recurring">("day_off");
  const [reqDate, setReqDate] = useState("");
  const [reqStartTime, setReqStartTime] = useState("");
  const [reqEndTime, setReqEndTime] = useState("");
  const [reqWeekday, setReqWeekday] = useState(1);
  const [reqReason, setReqReason] = useState("");

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

  function handleSubmitAvailability() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await submitAvailabilityRequest(staffToken, {
        requestType: reqType,
        date: reqType !== "recurring" ? reqDate || undefined : undefined,
        startTime: reqType === "hours_limit" ? reqStartTime || undefined : undefined,
        endTime: reqType === "hours_limit" ? reqEndTime || undefined : undefined,
        weekday: reqType === "recurring" ? reqWeekday : undefined,
        reason: reqReason || undefined,
      });
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess("Availability request submitted. Your manager will review it.");
        setShowAvailForm(false);
        setReqDate("");
        setReqStartTime("");
        setReqEndTime("");
        setReqReason("");
      }
    });
  }

  const calendarUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/calendar/${staffToken}`
    : `/api/calendar/${staffToken}`;

  const webcalUrl = calendarUrl.replace(/^https?:/, "webcal:");

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-danger">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}

      {shifts.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No upcoming shifts.
        </p>
      ) : (
        <div className="space-y-3">
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
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <button
          onClick={() => setShowAvailForm(!showAvailForm)}
          className="flex items-center justify-between w-full text-sm font-medium"
        >
          Request Availability Change
          {showAvailForm ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showAvailForm && (
          <div className="space-y-3 pt-2 border-t border-border">
            <div>
              <label className="text-xs text-muted-foreground">Request type</label>
              <select
                value={reqType}
                onChange={(e) => setReqType(e.target.value as typeof reqType)}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="day_off">Day off</option>
                <option value="hours_limit">Hours limit</option>
                <option value="recurring">Recurring</option>
              </select>
            </div>

            {reqType !== "recurring" && (
              <div>
                <label className="text-xs text-muted-foreground">Date</label>
                <input
                  type="date"
                  value={reqDate}
                  onChange={(e) => setReqDate(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}

            {reqType === "hours_limit" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Start time</label>
                  <input
                    type="time"
                    value={reqStartTime}
                    onChange={(e) => setReqStartTime(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">End time</label>
                  <input
                    type="time"
                    value={reqEndTime}
                    onChange={(e) => setReqEndTime(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            )}

            {reqType === "recurring" && (
              <div>
                <label className="text-xs text-muted-foreground">Weekday</label>
                <select
                  value={reqWeekday}
                  onChange={(e) => setReqWeekday(Number(e.target.value))}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {WEEKDAY_LABELS.map((label, i) => (
                    <option key={i} value={i}>{label}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs text-muted-foreground">Reason (optional)</label>
              <textarea
                value={reqReason}
                onChange={(e) => setReqReason(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="h-7 text-xs"
                disabled={pending}
                onClick={handleSubmitAvailability}
              >
                Submit request
              </Button>
              <Button
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setShowAvailForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {availabilityRequests.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium">My Requests</h2>
          {availabilityRequests.map((req) => (
            <div
              key={req.id}
              className="rounded-lg border border-border bg-card p-3 space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <Badge className={
                  req.request_type === "day_off" ? "bg-blue-500/10 text-blue-600" :
                  req.request_type === "hours_limit" ? "bg-purple-500/10 text-purple-600" :
                  "bg-teal-500/10 text-teal-600"
                }>
                  {req.request_type === "day_off" ? "Day off" :
                   req.request_type === "hours_limit" ? "Hours limit" : "Recurring"}
                </Badge>
                <Badge className={
                  req.status === "pending" ? "bg-amber-500/10 text-amber-600" :
                  req.status === "approved" ? "bg-emerald-500/10 text-emerald-600" :
                  "bg-red-500/10 text-red-600"
                }>
                  {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {req.date && <span>{req.date}</span>}
                {req.start_time && req.end_time && <span> {req.start_time}–{req.end_time}</span>}
                {req.weekday != null && <span>{WEEKDAY_LABELS[req.weekday]}</span>}
              </div>
              {req.reason && (
                <p className="text-xs text-muted-foreground">{req.reason}</p>
              )}
            </div>
          ))}
        </div>
      )}

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
