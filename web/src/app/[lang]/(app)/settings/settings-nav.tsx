"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const tabs = [
  { path: "/profile", labelKey: "profile" },
  { path: "", labelKey: "org" },
  { path: "/sites", labelKey: "sites" },
  { path: "/areas", labelKey: "areas" },
  { path: "/roles", labelKey: "roles" },
  { path: "/templates", labelKey: "templates" },
  { path: "/blocked-dates", labelKey: "blockedDates" },
  { path: "/members", labelKey: "members" },
  { path: "/billing", labelKey: "billing" },
  { path: "/notifications", labelKey: "notifications" },
] as const;

export function SettingsNav() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("settings");
  const base = `/${locale}/settings`;

  return (
    <nav className="border-b border-border px-6">
      <div className="flex gap-1">
        {tabs.map((tab) => {
          const href = `${base}${tab.path}`;
          const active =
            tab.path === ""
              ? pathname === base
              : pathname.startsWith(href);
          return (
            <Link
              key={tab.path}
              href={href}
              className={cn(
                "px-3 py-2 text-sm font-medium transition border-b-2 -mb-px",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
              )}
            >
              {t(tab.labelKey)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
