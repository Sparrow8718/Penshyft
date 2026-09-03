"use client";

import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cancelSwapRequest } from "./actions";

const statusColor: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600",
  approved: "bg-emerald-500/10 text-emerald-600",
  denied: "bg-red-500/10 text-red-600",
  cancelled: "bg-zinc-500/10 text-zinc-500",
};

export function SwapView({
  swapId,
  token,
  status,
  reason,
  managerNote,
  staffName,
  shiftDate,
  startTime,
  endTime,
  siteName,
  createdAt,
  resolvedAt,
}: {
  swapId: string;
  token: string;
  status: string;
  reason: string | null;
  managerNote: string | null;
  staffName: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  siteName: string;
  createdAt: string;
  resolvedAt: string | null;
}) {
  const [pending, startTransition] = useTransition();

  function handleCancel() {
    startTransition(async () => {
      await cancelSwapRequest(token);
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="bg-card border border-border rounded-xl p-8 max-w-md w-full space-y-4">
        <div className="text-center">
          <h1 className="text-lg font-semibold mb-1">Swap Request</h1>
          <Badge className={statusColor[status] ?? ""}>{status}</Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Staff</span>
            <span className="font-medium">{staffName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shift</span>
            <span className="font-medium">{shiftDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Time</span>
            <span className="font-medium">{startTime}–{endTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Site</span>
            <span className="font-medium">{siteName}</span>
          </div>
          {reason && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reason</span>
              <span className="font-medium text-right max-w-[60%]">{reason}</span>
            </div>
          )}
          {managerNote && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Manager note</span>
              <span className="font-medium text-right max-w-[60%]">{managerNote}</span>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Requested {new Date(createdAt).toLocaleDateString()}
          {resolvedAt && (
            <> &middot; Resolved {new Date(resolvedAt).toLocaleDateString()}</>
          )}
        </div>

        {status === "pending" && (
          <Button
            variant="ghost"
            className="w-full text-danger"
            disabled={pending}
            onClick={handleCancel}
          >
            Cancel request
          </Button>
        )}
      </div>
    </div>
  );
}
