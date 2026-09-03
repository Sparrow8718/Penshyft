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

      const stripe = getStripe();
      let plan = "starter";
      if (subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = sub.items.data[0]?.price?.id;
        if (priceId && STRIPE_PRICE_MAP[priceId]) {
          plan = STRIPE_PRICE_MAP[priceId];
        }
      }

      await db
        .from("org")
        .update({
          plan,
          stripe_customer_id: customerId ?? null,
          stripe_subscription_id: subscriptionId ?? null,
        })
        .eq("id", orgId);
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price?.id;
      const newPlan = priceId ? STRIPE_PRICE_MAP[priceId] : undefined;
      if (!newPlan) break;

      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
      if (!customerId) break;

      await db
        .from("org")
        .update({ plan: newPlan })
        .eq("stripe_customer_id", customerId);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
      if (!customerId) break;

      await db
        .from("org")
        .update({
          plan: "free",
          stripe_subscription_id: null,
        })
        .eq("stripe_customer_id", customerId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
