// Pure plan constants. No server-only imports here — this module is imported
// by client components (e.g. the marketing pricing table and billing panel),
// so it must stay free of the service-role db client. Server-side limit
// checking lives in ./check-limit.ts.

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
