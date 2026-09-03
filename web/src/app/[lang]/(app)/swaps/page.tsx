import { getLocale, getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/server";
import { SwapsList } from "./swaps-list";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: `${t("swaps")} · Penshyft` };
}

export default async function SwapsPage() {
  const locale = await getLocale();
  const session = await requireSession(locale);

  const supa = db();

  const { data: sites } = await supa
    .from("site")
    .select("id")
    .eq("org_id", session.orgId);

  const siteIds = (sites ?? []).map((s) => s.id);

  if (siteIds.length === 0) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">No sites found.</p>
      </div>
    );
  }

  const { data: swaps } = await supa
    .from("shift_swap")
    .select(`
      id,
      status,
      reason,
      manager_note,
      token,
      created_at,
      resolved_at,
      shift:shift_id (id, date, start_time, end_time, site_id),
      requester:requester_staff_id (id, name, email)
    `)
    .in("shift.site_id", siteIds)
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-lg font-semibold">Swap Requests</h1>
      <SwapsList swaps={swaps ?? []} />
    </div>
  );
}
