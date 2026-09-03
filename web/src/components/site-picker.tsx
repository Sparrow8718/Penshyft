"use client";

import { useTranslations } from "next-intl";
import { useSession } from "@/lib/auth/context";
import { switchSite } from "@/lib/site/switch-site";
import { PLAN_LIMITS, type PlanKey } from "@/lib/billing/plans";
import { MapPin } from "lucide-react";

export function SitePicker() {
  const session = useSession();
  const t = useTranslations("nav");
  const { sites } = session;
  const limit = PLAN_LIMITS[session.orgPlan as PlanKey]?.sites ?? 1;

  if (sites.length <= 1) return null;

  return (
    <div className="px-3 pb-2">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground px-3 pb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <MapPin size={10} />
          {t("switchSite")}
        </span>
        <span>{sites.length}/{limit}</span>
      </div>
      <div className="space-y-0.5">
        {sites.map((s) => (
          <button
            key={s.id}
            onClick={async () => {
              if (s.id === session.siteId) return;
              await switchSite(s.id);
            }}
            className={`w-full text-left rounded-md px-3 py-1.5 text-xs transition ${
              s.id === session.siteId
                ? "bg-accent text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}
