import { getLocale, getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/server";
import { RequestsList } from "./requests-list";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("staff");
  return { title: `${t("availabilityRequests")} · Penshyft` };
}

export default async function RequestsPage() {
  const locale = await getLocale();
  const session = await requireSession(locale);

  const supa = db();

  const { data: requests } = await supa
    .from("availability_request")
    .select("id, request_type, date, start_time, end_time, weekday, reason, status, created_at, staff_id, staff:staff_id (name)")
    .eq("org_id", session.orgId)
    .eq("status", "pending")
    .order("created_at");

  const enriched = (requests ?? []).map((r) => {
    const staff = Array.isArray(r.staff) ? r.staff[0] : r.staff;
    return {
      id: r.id,
      request_type: r.request_type,
      date: r.date,
      start_time: r.start_time,
      end_time: r.end_time,
      weekday: r.weekday,
      reason: r.reason,
      status: r.status,
      created_at: r.created_at,
      staff_name: staff?.name ?? "Unknown",
    };
  });

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-lg font-semibold">{enriched.length > 0 ? `Availability Requests (${enriched.length})` : "Availability Requests"}</h1>
        <p className="text-xs text-muted-foreground">Review and respond to staff availability requests.</p>
      </div>
      <RequestsList requests={enriched} />
    </div>
  );
}
