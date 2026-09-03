import type { BillingProvider } from "@/lib/providers/types";

export const mockBillingProvider: BillingProvider = {
  name: "mock",
  enabled: false,
  async createCheckoutSession() {
    return { ok: false, error: "billing is off in mock mode" };
  },
  async createPortalSession() {
    return { ok: false, error: "billing is off in mock mode" };
  },
  async cancelSubscription() {
    return { ok: false, error: "billing is off in mock mode" };
  },
};
