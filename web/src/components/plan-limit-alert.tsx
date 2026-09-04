"use client";

import { useTranslations, useLocale } from "next-intl";
import { PLAN_LIMITS, type PlanKey } from "@/lib/billing/plans";
import { AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";

export function PlanLimitAlert({
  resource,
  current,
  max,
  plan,
}: {
  resource: "staff" | "sites" | "areas";
  current: number;
  max: number;
  plan: PlanKey;
}) {
  const t = useTranslations("billing");
  const locale = useLocale();

  if (current < max * 0.8) return null;

  const atLimit = current >= max;
  const nextPlan = plan === "free" ? "starter" : plan === "starter" ? "professional" : null;
  const nextLimit = nextPlan ? PLAN_LIMITS[nextPlan][resource] : null;

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
        atLimit
          ? "border-danger/30 bg-danger/5 text-danger"
          : "border-warning/30 bg-warning/5 text-warning"
      }`}
    >
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium">
          {t("limitBanner", { current, max, resource: t(resource), plan: t(plan) })}
        </p>
        {nextPlan && nextLimit && (
          <p className="text-xs mt-1 opacity-80">
            {t("upgradeHint", { plan: t(nextPlan), limit: nextLimit, resource: t(resource) })}
          </p>
        )}
      </div>
      {nextPlan && (
        <Link
          href={`/${locale}/settings/billing`}
          className="inline-flex items-center gap-1 shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition"
        >
          {t("upgrade")} <ArrowRight size={12} />
        </Link>
      )}
    </div>
  );
}
