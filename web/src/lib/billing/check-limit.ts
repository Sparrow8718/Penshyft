import "server-only";
import { db } from "@/lib/db/server";
import { PLAN_LIMITS, type PlanKey } from "./plans";

export async function checkPlanLimit(
  orgId: string,
  resource: "staff" | "sites" | "areas",
): Promise<{ allowed: boolean; current: number; max: number; plan: PlanKey }> {
  const supa = db();

  const { data: org } = await supa
    .from("org")
    .select("plan")
    .eq("id", orgId)
    .single();

  const plan = (org?.plan ?? "free") as PlanKey;
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  const max = limits[resource];

  let current = 0;

  if (resource === "staff") {
    const { count } = await supa
      .from("staff")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("active", true)
      .eq("archived", false);
    current = count ?? 0;
  } else if (resource === "sites") {
    const { count } = await supa
      .from("site")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("archived", false);
    current = count ?? 0;
  } else if (resource === "areas") {
    const { data: sites } = await supa
      .from("site")
      .select("id")
      .eq("org_id", orgId)
      .eq("archived", false);
    const siteIds = (sites ?? []).map((s) => s.id);
    if (siteIds.length > 0) {
      const { count } = await supa
        .from("area")
        .select("id", { count: "exact", head: true })
        .in("site_id", siteIds)
        .eq("archived", false);
      current = count ?? 0;
    }
  }

  return { allowed: current < max, current, max, plan };
}
