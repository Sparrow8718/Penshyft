"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { approveSwap, denySwap } from "./actions";
import { useRealtimeTable } from "@/lib/db/realtime";

type Swap = {
  id: string;
  status: string;
  reason: string | null;
  manager_note: string | null;
  token: string;
  created_at: string;
  resolved_at: string | null;
  shift: {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    site_id: string;
  } | null;
  requester: {
    id: string;
    name: string;
    email: string | null;
  } | null;
};

const statusColor: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600",
  approved: "bg-emerald-500/10 text-emerald-600",
  denied: "bg-red-500/10 text-red-600",
  cancelled: "bg-zinc-500/10 text-zinc-500",
  expired: "bg-zinc-500/10 text-zinc-500",
};

export function SwapsList({ swaps }: { swaps: Swap[] }) {
  useRealtimeTable("shift_swap");

  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleApprove(swapId: string) {
    setError(null);
    startTransition(async () => {
      const res = await approveSwap(swapId, notes[swapId] ?? "");
      if (res?.error) setError(res.error);
    });
  }

  function handleDeny(swapId: string) {
    setError(null);
    startTransition(async () => {
      const res = await denySwap(swapId, notes[swapId] ?? "");
      if (res?.error) setError(res.error);
    });
  }

  if (swaps.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No swap requests yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-danger">{error}</p>}
      {swaps.map((swap) => (
        <div
          key={swap.id}
          className="rounded-lg border border-border bg-card p-4 space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-medium">
                {swap.requester?.name ?? "Unknown staff"}
              </div>
              {swap.shift && (
                <div className="text-xs text-muted-foreground">
                  {swap.shift.date} &middot; {swap.shift.start_time}–{swap.shift.end_time}
                </div>
              )}
              {swap.reason && (
                <div className="mt-1 text-xs text-muted-foreground">
                  Reason: {swap.reason}
                </div>
              )}
            </div>
            <Badge className={statusColor[swap.status] ?? ""}>{swap.status}</Badge>
          </div>

          {swap.status === "pending" && (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Manager note (optional)"
                value={notes[swap.id] ?? ""}
                onChange={(e) =>
                  setNotes((prev) => ({ ...prev, [swap.id]: e.target.value }))
                }
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="h-7 text-xs"
                  disabled={pending}
                  onClick={() => handleApprove(swap.id)}
                >
                  <Check size={13} /> Approve
                </Button>
                <Button
                  variant="ghost"
                  className="h-7 text-xs text-danger"
                  disabled={pending}
                  onClick={() => handleDeny(swap.id)}
                >
                  <X size={13} /> Deny
                </Button>
              </div>
            </div>
          )}

          {swap.manager_note && swap.status !== "pending" && (
            <div className="text-xs text-muted-foreground">
              Manager note: {swap.manager_note}
            </div>
          )}

          <div className="text-[11px] text-muted-foreground">
            Requested {new Date(swap.created_at).toLocaleDateString()}
            {swap.resolved_at && (
              <> &middot; Resolved {new Date(swap.resolved_at).toLocaleDateString()}</>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
