import type { BillingProvider } from "@/lib/providers/types";
import { mockBillingProvider } from "./mock";
import { stripeBillingProvider } from "./stripe";

export function getBillingProvider(): BillingProvider {
  const billing = process.env.BILLING_MODE ?? "off";
  if (billing !== "on") return mockBillingProvider;
  return stripeBillingProvider;
}
