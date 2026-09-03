"use server";

import { headers } from "next/headers";
import { isPlanKey, PLAN_LIMITS } from "@/lib/billing/plans";
import { getBillingProvider } from "@/lib/providers/billing";
import { getUsage } from "@/lib/billing/usage";
import { db } from "@/lib/db/server";
import { requireSession } from "@/lib/auth/session";

export async function createCheckout(planKey: string) {
  if (!isPlanKey(planKey)) return { error: "Invalid plan." };
  if (planKey === "free") return { error: "Cannot checkout free plan." };

  const provider = getBillingProvider();
  if (!provider.enabled) {
    return {
      error: "Billing is not active in this environment. Plans will be enforced when Stripe is connected.",
    };
  }

  const session = await requireSession("en");
  const orgId = session.orgId;

  const plan = PLAN_LIMITS[planKey];
  const priceId = plan.stripePriceId;
  if (!priceId) return { error: "No price configured for this plan." };

  // Block a downgrade that would leave the org over the target plan's limits.
  const usage = await getUsage(orgId);
  if (usage.staff.current > plan.staff) {
    return { error: `The ${plan.label} plan allows ${plan.staff} staff, but you have ${usage.staff.current}. Archive staff before downgrading.` };
  }
  if (usage.sites.current > plan.sites) {
    return { error: `The ${plan.label} plan allows ${plan.sites} sites, but you have ${usage.sites.current}. Archive sites before downgrading.` };
  }
  if (usage.areas.current > plan.areas) {
    return { error: `The ${plan.label} plan allows ${plan.areas} areas, but you have ${usage.areas.current}. Archive areas before downgrading.` };
  }

  const { data: org } = await db()
    .from("org")
    .select("stripe_customer_id")
    .eq("id", orgId)
    .single();

  const hdrs = await headers();
  const origin = hdrs.get("origin") ?? hdrs.get("x-forwarded-host") ?? "http://localhost:3000";
  const lang = hdrs.get("x-next-intl-locale") ?? "en";

  const result = await provider.createCheckoutSession({
    orgId,
    priceId,
    customerId: org?.stripe_customer_id ?? undefined,
    successUrl: `${origin}/${lang}/settings/billing?success=1`,
    cancelUrl: `${origin}/${lang}/settings/billing?cancelled=1`,
  });

  if ("ok" in result && !result.ok) return { error: result.error };
  return { url: (result as { url: string }).url };
}

export async function createPortalSession() {
  const provider = getBillingProvider();
  if (!provider.enabled) {
    return { error: "Billing is not active in this environment." };
  }

  const session = await requireSession("en");
  const { data: org } = await db()
    .from("org")
    .select("stripe_customer_id")
    .eq("id", session.orgId)
    .single();

  if (!org?.stripe_customer_id) {
    return { error: "No billing account linked." };
  }

  const hdrs = await headers();
  const origin = hdrs.get("origin") ?? hdrs.get("x-forwarded-host") ?? "http://localhost:3000";
  const lang = hdrs.get("x-next-intl-locale") ?? "en";

  const result = await provider.createPortalSession({
    customerId: org.stripe_customer_id,
    returnUrl: `${origin}/${lang}/settings/billing`,
  });

  if ("ok" in result && !result.ok) return { error: result.error };
  return { url: (result as { url: string }).url };
}

export async function cancelSubscription() {
  const provider = getBillingProvider();
  if (!provider.enabled) {
    return { error: "Billing is not active in this environment." };
  }

  const session = await requireSession("en");
  const { data: org } = await db()
    .from("org")
    .select("stripe_subscription_id")
    .eq("id", session.orgId)
    .single();

  if (!org?.stripe_subscription_id) {
    return { error: "No active subscription." };
  }

  const result = await provider.cancelSubscription({
    subscriptionId: org.stripe_subscription_id,
  });

  if (!result.ok) return { error: result.error };
  return { ok: true };
}
