import { db } from "@/lib/db/server";
import { verifyStaffToken } from "@/lib/auth/staff-token";
import { StaffPortal } from "./staff-portal";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: "My Shifts · Penshyft" };
}

export default async function StaffPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const staffId = verifyStaffToken(token);

  if (!staffId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-card border border-border rounded-xl p-8 max-w-md text-center">
          <h1 className="text-lg font-semibold mb-2">Invalid link</h1>
          <p className="text-sm text-muted-foreground">
            This staff portal link is invalid.
          </p>
        </div>
      </div>
    );
  }

  const supa = db();

  const { data: staff } = await supa
    .from("staff")
    .select("id, name, email")
    .eq("id", staffId)
    .single();

  if (!staff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-card border border-border rounded-xl p-8 max-w-md text-center">
          <h1 className="text-lg font-semibold mb-2">Not found</h1>
          <p className="text-sm text-muted-foreground">
            Staff member not found.
          </p>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  const { data: shifts } = await supa
    .from("shift")
    .select("id, date, start_time, end_time, status, role:role_id (name), area:area_id (name)")
    .eq("filled_by", staffId)
    .gte("date", today)
    .order("date")
    .order("start_time");

  const { data: pendingSwaps } = await supa
    .from("shift_swap")
    .select("id, shift_id, status")
    .eq("requester_staff_id", staffId)
    .eq("status", "pending");

  const { data: availabilityRequests } = await supa
    .from("availability_request")
    .select("id, request_type, date, start_time, end_time, weekday, reason, status, created_at")
    .eq("staff_id", staffId)
    .order("created_at", { ascending: false });

  const pendingShiftIds = new Set((pendingSwaps ?? []).map((s) => s.shift_id));

  const enrichedShifts = (shifts ?? []).map((s) => {
    const role = Array.isArray(s.role) ? s.role[0] : s.role;
    const area = Array.isArray(s.area) ? s.area[0] : s.area;
    return {
      id: s.id,
      date: s.date,
      startTime: s.start_time,
      endTime: s.end_time,
      status: s.status,
      roleName: role?.name ?? "",
      areaName: area?.name ?? null,
      hasPendingSwap: pendingShiftIds.has(s.id),
    };
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-lg font-semibold">My Upcoming Shifts</h1>
          <p className="text-sm text-muted-foreground">{staff.name}</p>
        </div>
        <StaffPortal
          staffId={staff.id}
          staffToken={token}
          shifts={enrichedShifts}
          availabilityRequests={availabilityRequests ?? []}
        />
      </div>
    </div>
  );
}
