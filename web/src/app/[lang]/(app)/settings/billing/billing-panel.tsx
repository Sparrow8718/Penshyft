"use client";

import { useTranslations } from "next-intl";
import { useTransition, useState } from "react";
import { PLAN_LIMITS, type PlanKey } from "@/lib/billing/plans";
import { createCheckout, createPortalSession } from "./actions";

type Usage = {
  plan: PlanKey;
  staff: { current: number; max: number };
  sites: { current: number; max: number };
  areas: { current: number; max: number };
};

const PLAN_KEYS: PlanKey[] = ["free", "starter", "professional"];

function ProgressBar({ current, max }: { current: number; max: number }) {
  const t = useTranslations("billing");
  const pct = max === 0 ? 0 : Math.min((current / max) * 100, 100);
  const atLimit = current >= max;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {current} / {max}
        </span>
        {atLimit && (
          <span className="text-danger font-medium">{t("limitReached")}</span>
        )}
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            atLimit ? "bg-danger" : "bg-primary"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function BillingPanel({
  usage,
  orgId,
  billingActive,
  hasCustomer,
}: {
  usage: Usage;
  orgId: string;
  billingActive: boolean;
  hasCustomer: boolean;
}) {
  const t = useTranslations("billing");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleUpgrade(planKey: PlanKey) {
    startTransition(async () => {
      const result = await createCheckout(planKey);
      if ("url" in result && result.url) {
        window.location.href = result.url;
        return;
      }
      if ("error" in result) setMessage(result.error ?? null);
    });
  }

  function handleManageBilling() {
    startTransition(async () => {
      const result = await createPortalSession();
      if ("url" in result && result.url) {
        window.location.href = result.url;
        return;
      }
      if ("error" in result) setMessage(result.error ?? null);
    });
  }

  return (
    <div className="space-y-8 p-6">
      {!billingActive && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm text-amber-800 dark:text-amber-200">
          {t("billingNotActive")}
        </div>
      )}

      {/* Current plan */}
      <section>
        <h2 className="text-lg font-semibold mb-1">{t("currentPlan")}</h2>
        <div className="inline-flex items-center gap-2">
          <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-medium">
            {PLAN_LIMITS[usage.plan].label}
          </span>
          {usage.plan !== "free" && (
            <span className="text-muted-foreground text-sm">
              £{PLAN_LIMITS[usage.plan].price.toFixed(2)}{" "}
              {t("perMonth")}
            </span>
          )}
        </div>
        {billingActive && hasCustomer && (
          <div className="mt-3">
            <button
              onClick={handleManageBilling}
              disabled={pending}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition disabled:opacity-50"
            >
              {t("manageBilling")}
            </button>
          </div>
        )}
      </section>

      {/* Usage */}
      <section>
        <h2 className="text-lg font-semibold mb-4">{t("usage")}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border p-4">
            <div className="text-sm font-medium mb-2">{t("staff")}</div>
            <ProgressBar
              current={usage.staff.current}
              max={usage.staff.max}
            />
          </div>
          <div className="rounded-lg border border-border p-4">
            <div className="text-sm font-medium mb-2">{t("sites")}</div>
            <ProgressBar
              current={usage.sites.current}
              max={usage.sites.max}
            />
          </div>
          <div className="rounded-lg border border-border p-4">
            <div className="text-sm font-medium mb-2">{t("areas")}</div>
            <ProgressBar
              current={usage.areas.current}
              max={usage.areas.max}
            />
          </div>
        </div>
      </section>

      {/* Plan comparison cards */}
      <section>
        <h2 className="text-lg font-semibold mb-4">{t("title")}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {PLAN_KEYS.map((key) => {
            const plan = PLAN_LIMITS[key];
            const isCurrent = key === usage.plan;
            const pitchKey =
              key === "free"
                ? "freePitch"
                : key === "starter"
                  ? "starterPitch"
                  : "professionalPitch";

            return (
              <div
                key={key}
                className={`rounded-lg border p-5 flex flex-col ${
                  isCurrent
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border"
                }`}
              >
                <div className="text-base font-semibold">{plan.label}</div>
                <div className="text-2xl font-bold mt-1">
                  {plan.price === 0 ? (
                    t("free")
                  ) : (
                    <>
                      £{plan.price.toFixed(2)}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{t("perMonth")}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2 flex-1">
                  {t(pitchKey)}
                </p>
                <ul className="text-sm mt-3 space-y-1">
                  <li>
                    {plan.sites} {t("sites")}
                  </li>
                  <li>
                    {plan.areas} {t("areas")}
                  </li>
                  <li>
                    {plan.staff} {t("staff")}
                  </li>
                </ul>
                <div className="mt-4">
                  {isCurrent ? (
                    <span className="inline-block w-full text-center rounded-md bg-muted py-2 text-sm font-medium text-muted-foreground">
                      {t("current")}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(key)}
                      disabled={pending || key === "free"}
                      className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition"
                    >
                      {PLAN_KEYS.indexOf(key) >
                      PLAN_KEYS.indexOf(usage.plan)
                        ? t("upgrade")
                        : t("downgrade")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {message && (
        <div className="rounded-lg border border-border bg-card p-4 text-sm">
          {message}
          <button
            onClick={() => setMessage(null)}
            className="ml-3 text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
