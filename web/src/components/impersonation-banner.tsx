"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSession } from "@/lib/auth/context";
import { stopImpersonation } from "@/lib/admin/impersonate";

export function ImpersonationBanner() {
  const session = useSession();
  const t = useTranslations("admin");
  const locale = useLocale();

  if (!session.isImpersonating) return null;

  async function handleExit() {
    await stopImpersonation();
    window.location.href = `/${locale}/admin`;
  }

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-3 bg-amber-500 px-4 py-1.5 text-sm font-medium text-black">
      <span>{t("impersonatingBanner", { orgName: session.orgName })}</span>
      <button
        onClick={handleExit}
        className="rounded bg-black/20 px-2 py-0.5 text-xs font-semibold hover:bg-black/30 transition"
      >
        {t("exitImpersonation")}
      </button>
    </div>
  );
}
