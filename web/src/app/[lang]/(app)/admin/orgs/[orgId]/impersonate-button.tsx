"use client";

import { useLocale } from "next-intl";
import { startImpersonation } from "@/lib/admin/impersonate";
import { Eye } from "lucide-react";

export function ImpersonateButton({ orgId, label }: { orgId: string; label: string }) {
  const locale = useLocale();

  async function handleClick() {
    const result = await startImpersonation(orgId);
    if ("ok" in result) {
      window.location.href = `/${locale}/dashboard`;
    }
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition"
    >
      <Eye size={14} />
      {label}
    </button>
  );
}
