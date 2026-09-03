import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { STRIPE_PRICE_MAP } from "@/lib/billing/plans";
import type { Database } from "@/lib/db/types";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-08-26.dahlia",
  });
}

function supaAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const db = supaAdmin();

  // Handlers are idempotent (they set absolute state keyed by org / customer),
  // so Stripe's at-least-once redelivery is safe without a processed-event
  // table. Any DB write failure returns 500 so Stripe retries the event.
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.org_id;
        if (!orgId) break;

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;

        // Resolve the plan strictly from the subscription's price. Never
        // default to a plan — a wrong guess under-provisions a paying customer.
        let plan: string | undefined;
        if (subscriptionId) {
          const sub = await getStripe().subscriptions.retrieve(subscriptionId);
          const priceId = sub.items.data[0]?.price?.id;
          plan = priceId ? STRIPE_PRICE_MAP[priceId] : undefined;
          if (!plan) {
            console.error(
              `[stripe webhook] Unmapped price on subscription ${subscriptionId} (price ${priceId}); org ${orgId} plan left unchanged. Check STRIPE_PRICE_* env vars.`,
            );
          }
        }

        const update: {
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          plan?: string;
        } = {
          stripe_customer_id: customerId ?? null,
          stripe_subscription_id: subscriptionId ?? null,
        };
        if (plan) update.plan = plan;

        const { error } = await db.from("org").update(update).eq("id", orgId);
        if (error) throw error;
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const priceId = sub.items.data[0]?.price?.id;
        const newPlan = priceId ? STRIPE_PRICE_MAP[priceId] : undefined;
        if (!newPlan) {
          if (priceId) {
            console.error(
              `[stripe webhook] Unmapped price ${priceId} on subscription.updated; ignoring.`,
            );
          }
          break;
        }

        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        if (!customerId) break;

        const { error } = await db
          .from("org")
          .update({ plan: newPlan })
          .eq("stripe_customer_id", customerId);
        if (error) throw error;
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        if (!customerId) break;

        const { error } = await db
          .from("org")
          .update({
            plan: "free",
            stripe_subscription_id: null,
          })
          .eq("stripe_customer_id", customerId);
        if (error) throw error;
        break;
      }
    }
  } catch (err) {
    console.error("[stripe webhook] handler failed:", err);
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
