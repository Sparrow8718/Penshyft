import { db } from "@/lib/db/server";
import { OfferResponse } from "./offer-response";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: "Shift Offer · Penshyft" };
}

export default async function OfferPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supa = db();

  const { data: offer } = await supa
    .from("shift_offer")
    .select(
      "id, outcome, sent_at, shift_id, staff_id, staff:staff_id (name), shift:shift_id (date, start_time, end_time, status, role:role_id (name), area:area_id (name), site:site_id (name))",
    )
    .eq("token", token)
    .maybeSingle();

  if (!offer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-card border border-border rounded-xl p-8 max-w-md text-center">
          <h1 className="text-lg font-semibold mb-2">Offer not found</h1>
          <p className="text-sm text-muted-foreground">
            This link may have expired or is invalid.
          </p>
        </div>
      </div>
    );
  }

  const shift = Array.isArray(offer.shift) ? offer.shift[0] : offer.shift;
  const staffMember = Array.isArray(offer.staff) ? offer.staff[0] : offer.staff;
  const role = shift ? (Array.isArray(shift.role) ? shift.role[0] : shift.role) : null;
  const area = shift ? (Array.isArray(shift.area) ? shift.area[0] : shift.area) : null;
  const site = shift ? (Array.isArray(shift.site) ? shift.site[0] : shift.site) : null;

  return (
    <OfferResponse
      offerId={offer.id}
      token={token}
      outcome={offer.outcome}
      staffName={staffMember?.name ?? ""}
      shiftDate={shift?.date ?? ""}
      startTime={shift?.start_time ?? ""}
      endTime={shift?.end_time ?? ""}
      roleName={role?.name ?? ""}
      areaName={area?.name ?? null}
      siteName={site?.name ?? ""}
      shiftStatus={shift?.status ?? ""}
    />
  );
}
