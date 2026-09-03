"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { ThemeToggle } from "@/components/theme-toggle";

export function MarketingHeader() {
  const t = useTranslations("landing");
  const locale = useLocale();

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-14">
        <Link href={`/${locale}`} className="text-lg font-bold tracking-tight">
          Penshyft
        </Link>

        <nav className="hidden sm:flex items-center gap-6 text-sm">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition">
            {t("featuresTitle")}
          </a>
          <a href="#pricing" className="text-muted-foreground hover:text-foreground transition">
            {t("pricingNav")}
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href={`/${locale}/login`}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition"
          >
            {t("login")}
          </Link>
          <Link
            href={`/${locale}/signup`}
            className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
          >
            {t("signup")}
          </Link>
        </div>
      </div>
    </header>
  );
}
