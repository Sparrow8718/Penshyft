"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, X } from "lucide-react";
import { respondToOffer } from "./actions";

export function OfferResponse({
  offerId,
  token,
  outcome,
  staffName,
  shiftDate,
  startTime,
  endTime,
  roleName,
  areaName,
  siteName,
  shiftStatus,
}: {
  offerId: string;
  token: string;
  outcome: string | null;
  staffName: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  roleName: string;
  areaName: string | null;
  siteName: string;
  shiftStatus: string;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(outcome);

  function handleRespond(action: "accept" | "decline") {
    startTransition(async () => {
      const res = await respondToOffer(token, action);
      if (res.outcome) setResult(res.outcome);
      else if (res.error) setResult(res.error);
    });
  }

  const alreadyFilled = shiftStatus === "filled" || shiftStatus === "cancelled";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="bg-card border border-border rounded-xl p-8 max-w-md w-full">
        <div className="flex items-center gap-2 mb-6">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <Sparkles size={16} />
          </div>
          <span className="text-lg font-semibold">Penshyft</span>
        </div>

        <h1 className="text-base font-semibold mb-1">
          Hi {staffName}!
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {result ? "Here's the status of your shift offer." : "You've been offered a shift:"}
        </p>

        <div className="rounded-lg border border-border p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium">{roleName}</span>
          </div>
          {areaName && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Area</span>
              <span className="font-medium">{areaName}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Site</span>
            <span className="font-medium">{siteName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Date</span>
            <span className="font-medium">{shiftDate}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Time</span>
            <span className="font-medium">
              {startTime.slice(0, 5)} – {endTime.slice(0, 5)}
            </span>
          </div>
        </div>

        {result === "accepted" && (
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4 text-center">
            <Check size={24} className="mx-auto text-emerald-500 mb-2" />
            <p className="text-sm font-medium text-emerald-400">Shift accepted!</p>
            <p className="text-xs text-muted-foreground mt-1">You're confirmed for this shift.</p>
          </div>
        )}

        {result === "declined" && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-center">
            <X size={24} className="mx-auto text-red-400 mb-2" />
            <p className="text-sm font-medium text-red-400">Shift declined</p>
            <p className="text-xs text-muted-foreground mt-1">Thanks for letting us know.</p>
          </div>
        )}

        {result === "filled_elsewhere" && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4 text-center">
            <p className="text-sm font-medium text-amber-400">Already filled</p>
            <p className="text-xs text-muted-foreground mt-1">This shift was filled by someone else.</p>
          </div>
        )}

        {result && !["accepted", "declined", "filled_elsewhere"].includes(result) && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-center">
            <p className="text-sm text-red-400">{result}</p>
          </div>
        )}

        {!result && !alreadyFilled && (
          <div className="flex gap-3">
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => handleRespond("accept")}
              disabled={pending}
            >
              <Check size={16} /> Accept
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => handleRespond("decline")}
              disabled={pending}
            >
              <X size={16} /> Decline
            </Button>
          </div>
        )}

        {!result && alreadyFilled && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4 text-center">
            <p className="text-sm font-medium text-amber-400">Shift no longer available</p>
            <p className="text-xs text-muted-foreground mt-1">
              This shift has already been {shiftStatus}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
