"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="rounded-xl border border-border bg-card p-8 max-w-md text-center space-y-4">
        <h1 className="text-lg font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
        {error.message && process.env.NODE_ENV === "development" && (
          <pre className="text-xs text-danger bg-danger/5 rounded-md p-3 text-left overflow-auto max-h-32">
            {error.message}
          </pre>
        )}
        <Button onClick={reset}>{t("retry")}</Button>
      </div>
    </div>
  );
}
