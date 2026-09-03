import { db } from "@/lib/db/server";

export const PLAN_LIMITS = {
  free: { sites: 1, areas: 1, staff: 15, price: 0, label: "Free", stripePriceId: null as string | null },
  starter: { sites: 3, areas: 5, staff: 50, price: 4.99, label: "Starter", stripePriceId: process.env.STRIPE_PRICE_STARTER ?? "" },
  professional: { sites: 10, areas: 25, staff: 250, price: 14.99, label: "Professional", stripePriceId: process.env.STRIPE_PRICE_PROFESSIONAL ?? "" },
} as const;

export type PlanKey = keyof typeof PLAN_LIMITS;

export function isPlanKey(v: string): v is PlanKey {
  return v in PLAN_LIMITS;
}

export const STRIPE_PRICE_MAP: Record<string, PlanKey> = Object.fromEntries(
  (Object.entries(PLAN_LIMITS) as [PlanKey, (typeof PLAN_LIMITS)[PlanKey]][])
    .filter(([, v]) => v.stripePriceId)
    .map(([k, v]) => [v.stripePriceId, k]),
);

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
