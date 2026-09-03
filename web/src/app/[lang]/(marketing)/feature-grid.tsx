"use client";

import { useTranslations } from "next-intl";
import {
  CalendarClock,
  Users,
  ArrowLeftRight,
  BarChart3,
  Bell,
  Zap,
} from "lucide-react";

const FEATURES = [
  { icon: CalendarClock, titleKey: "feature1Title", descKey: "feature1Desc" },
  { icon: Zap, titleKey: "feature2Title", descKey: "feature2Desc" },
  { icon: Users, titleKey: "feature3Title", descKey: "feature3Desc" },
  { icon: ArrowLeftRight, titleKey: "feature4Title", descKey: "feature4Desc" },
  { icon: BarChart3, titleKey: "feature5Title", descKey: "feature5Desc" },
  { icon: Bell, titleKey: "feature6Title", descKey: "feature6Desc" },
] as const;

export function FeatureGrid() {
  const t = useTranslations("landing");

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map(({ icon: Icon, titleKey, descKey }) => (
        <div
          key={titleKey}
          className="rounded-xl border border-border bg-card p-6 space-y-3"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon size={20} className="text-primary" />
          </div>
          <h3 className="font-semibold">{t(titleKey)}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t(descKey)}
          </p>
        </div>
      ))}
    </div>
  );
}
