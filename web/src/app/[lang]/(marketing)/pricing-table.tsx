"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { PLAN_LIMITS, type PlanKey } from "@/lib/billing/plans";
import { Check } from "lucide-react";

const PLAN_KEYS: PlanKey[] = ["free", "starter", "professional"];

export function PricingTable() {
  const t = useTranslations("landing");
  const tb = useTranslations("billing");
  const locale = useLocale();

  return (
    <div className="grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
      {PLAN_KEYS.map((key) => {
        const plan = PLAN_LIMITS[key];
        const isPopular = key === "starter";
        const pitchKey =
          key === "free"
            ? "freePitch"
            : key === "starter"
              ? "starterPitch"
              : "professionalPitch";

        return (
          <div
            key={key}
            className={`rounded-xl border p-6 flex flex-col ${
              isPopular
                ? "border-primary ring-2 ring-primary/20 relative"
                : "border-border"
            }`}
          >
            {isPopular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                {t("popular")}
              </span>
            )}
            <div className="text-base font-semibold">{plan.label}</div>
            <div className="text-3xl font-bold mt-2">
              {plan.price === 0 ? (
                tb("free")
              ) : (
                <>
                  £{plan.price.toFixed(2)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{tb("perMonth")}
                  </span>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-3 flex-1">
              {tb(pitchKey)}
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <PlanFeature>{plan.sites} {tb("sites")}</PlanFeature>
              <PlanFeature>{plan.areas} {tb("areas")}</PlanFeature>
              <PlanFeature>{plan.staff} {tb("staff")}</PlanFeature>
            </ul>
            <Link
              href={`/${locale}/signup`}
              className={`mt-6 block w-full rounded-md py-2.5 text-center text-sm font-medium transition ${
                isPopular
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border border-border hover:bg-muted"
              }`}
            >
              {t("getStarted")}
            </Link>
          </div>
        );
      })}
    </div>
  );
}

function PlanFeature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <Check size={14} className="text-primary shrink-0" />
      <span>{children}</span>
    </li>
  );
}
