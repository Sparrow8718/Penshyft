export type SendResult = {
  ok: boolean;
  providerId?: string;
  error?: string;
};

export interface NotificationProvider {
  readonly name: string;
  sendEmail(args: {
    to: string;
    subject: string;
    body: string;
    orgId?: string;
    meta?: Record<string, unknown>;
  }): Promise<SendResult>;
  sendPush(args: {
    to: string;
    title: string;
    body: string;
    url?: string;
    orgId?: string;
    meta?: Record<string, unknown>;
  }): Promise<SendResult>;
}

export interface BillingProvider {
  readonly name: string;
  enabled: boolean;
  createCheckoutSession(args: {
    orgId: string;
    priceId: string;
    customerId?: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ url: string } | { ok: false; error: string }>;
  createPortalSession(args: {
    customerId: string;
    returnUrl: string;
  }): Promise<{ url: string } | { ok: false; error: string }>;
  cancelSubscription(args: {
    subscriptionId: string;
  }): Promise<{ ok: true } | { ok: false; error: string }>;
}
