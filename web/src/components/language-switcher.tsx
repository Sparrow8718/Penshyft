"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n/config";

const labels: Record<Locale, { flag: string; short: string }> = {
  en: { flag: "🇬🇧", short: "EN" },
  fr: { flag: "🇫🇷", short: "FR" },
  es: { flag: "🇪🇸", short: "ES" },
  pt: { flag: "🇵🇹", short: "PT" },
};

export function LanguageSwitcher() {
  const currentLocale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function switchTo(locale: Locale) {
    const segments = pathname.split("/");
    segments[1] = locale;
    window.location.href = segments.join("/");
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Switch language"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-1 rounded-md border border-border bg-card px-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition"
      >
        <span>{labels[currentLocale as Locale].flag}</span>
        <span className="text-xs font-medium">{labels[currentLocale as Locale].short}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 flex flex-col rounded-md border border-border bg-card shadow-lg z-50 min-w-[120px] py-1">
          {locales.map((locale) => (
            <button
              key={locale}
              onClick={() => switchTo(locale)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm transition hover:bg-accent ${
                locale === currentLocale
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              }`}
            >
              <span>{labels[locale].flag}</span>
              <span>{labels[locale].short}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
