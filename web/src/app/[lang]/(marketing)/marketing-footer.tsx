"use client";

import { useTranslations } from "next-intl";

export function MarketingFooter() {
  const t = useTranslations("landing");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-8 text-center text-sm text-muted-foreground">
        {t("footerCopyright", { year })}
      </div>
    </footer>
  );
}
