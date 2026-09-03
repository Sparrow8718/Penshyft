import { db } from "@/lib/db/server";
import { PLAN_LIMITS, type PlanKey } from "./plans";

export async function getUsage(orgId: string) {
  const supa = db();

  const [orgRes, staffRes, sitesRes] = await Promise.all([
    supa.from("org").select("plan").eq("id", orgId).single(),
    supa
      .from("staff")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("active", true)
      .eq("archived", false),
    supa
      .from("site")
      .select("id")
      .eq("org_id", orgId)
      .eq("archived", false),
  ]);

  const plan = (orgRes.data?.plan ?? "free") as PlanKey;
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

  const siteIds = (sitesRes.data ?? []).map((s) => s.id);
  let areaCount = 0;
  if (siteIds.length > 0) {
    const { count } = await supa
      .from("area")
      .select("id", { count: "exact", head: true })
      .in("site_id", siteIds)
      .eq("archived", false);
    areaCount = count ?? 0;
  }

  return {
    plan,
    staff: { current: staffRes.count ?? 0, max: limits.staff },
    sites: { current: siteIds.length, max: limits.sites },
    areas: { current: areaCount, max: limits.areas },
  };
}
