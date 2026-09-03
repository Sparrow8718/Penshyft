import { db } from "@/lib/db/server";
import { SwapView } from "./swap-view";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: "Swap Request · Penshyft" };
}

export default async function SwapPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supa = db();

  const { data: swap } = await supa
    .from("shift_swap")
    .select(
      "id, status, reason, manager_note, created_at, resolved_at, shift:shift_id (date, start_time, end_time, site:site_id (name)), requester:requester_staff_id (name)",
    )
    .eq("token", token)
    .maybeSingle();

  if (!swap) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-card border border-border rounded-xl p-8 max-w-md text-center">
          <h1 className="text-lg font-semibold mb-2">Not found</h1>
          <p className="text-sm text-muted-foreground">
            This swap request link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  const shift = Array.isArray(swap.shift) ? swap.shift[0] : swap.shift;
  const requester = Array.isArray(swap.requester) ? swap.requester[0] : swap.requester;
  const site = shift ? (Array.isArray(shift.site) ? shift.site[0] : shift.site) : null;

  return (
    <SwapView
      swapId={swap.id}
      token={token}
      status={swap.status}
      reason={swap.reason}
      managerNote={swap.manager_note}
      staffName={requester?.name ?? "Unknown"}
      shiftDate={shift?.date ?? ""}
      startTime={shift?.start_time ?? ""}
      endTime={shift?.end_time ?? ""}
      siteName={site?.name ?? ""}
      createdAt={swap.created_at}
      resolvedAt={swap.resolved_at}
    />
  );
}
