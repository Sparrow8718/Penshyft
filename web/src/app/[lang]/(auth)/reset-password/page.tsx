"use client";

import { useTranslations, useLocale } from "next-intl";
import { useState, useTransition } from "react";
import Link from "next/link";
import { requestReset } from "./actions";

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await requestReset(fd);
      if (result?.error) setError(result.error);
      else setSent(true);
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-center mb-4">
        {t("resetPassword")}
      </h2>
      {sent ? (
        <p className="text-sm text-center text-muted-foreground">
          Check your email for a reset link.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              {t("email")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
          >
            {t("resetPassword")}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            <Link href={`/${locale}/login`} className="hover:underline">
              {t("hasAccount")}
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
