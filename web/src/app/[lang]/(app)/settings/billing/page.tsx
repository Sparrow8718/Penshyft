import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { getUsage } from "@/lib/billing/usage";
import { db } from "@/lib/db/server";
import { BillingPanel } from "./billing-panel";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: `${t("billing")} · ${t("title")} · Penshyft` };
}

const ALLOWED_ROLES = new Set(["system_admin", "org_admin"]);

export default async function BillingPage() {
  const locale = await getLocale();
  const session = await requireSession(locale);

  if (!ALLOWED_ROLES.has(session.role)) {
    redirect(`/${locale}/dashboard`);
  }

  const [usage, { data: org }] = await Promise.all([
    getUsage(session.orgId),
    db()
      .from("org")
      .select("stripe_customer_id")
      .eq("id", session.orgId)
      .single(),
  ]);

  const billingActive = process.env.BILLING_MODE === "on";
  const hasCustomer = !!org?.stripe_customer_id;

  return (
    <BillingPanel
      usage={usage}
      orgId={session.orgId}
      billingActive={billingActive}
      hasCustomer={hasCustomer}
    />
  );
}
