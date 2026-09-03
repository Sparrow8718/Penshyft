import Stripe from "stripe";
import type { BillingProvider } from "@/lib/providers/types";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2026-08-26.dahlia" });
}

export const stripeBillingProvider: BillingProvider = {
  name: "stripe",
  enabled: true,

  async createCheckoutSession({ orgId, priceId, customerId, successUrl, cancelUrl }) {
    const stripe = getStripe();
    const params: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { org_id: orgId },
    };
    if (customerId) {
      params.customer = customerId;
    } else {
      params.customer_creation = "always";
    }
    try {
      const session = await stripe.checkout.sessions.create(params);
      return { url: session.url! };
    } catch (err) {
      return { ok: false as const, error: (err as Error).message };
    }
  },

  async createPortalSession({ customerId, returnUrl }) {
    const stripe = getStripe();
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
      return { url: session.url };
    } catch (err) {
      return { ok: false as const, error: (err as Error).message };
    }
  },

  async cancelSubscription({ subscriptionId }) {
    const stripe = getStripe();
    try {
      await stripe.subscriptions.cancel(subscriptionId);
      return { ok: true as const };
    } catch (err) {
      return { ok: false as const, error: (err as Error).message };
    }
  },
};
