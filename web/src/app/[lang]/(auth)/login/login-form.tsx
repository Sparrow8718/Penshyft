"use client";

import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { login } from "./actions";

export function LoginForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? `/${locale}/dashboard`;
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await login(fd, next);
      if (result?.error) setError(result.error);
    });
  }

  return (
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
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          {t("password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
      >
        {pending ? t("signIn") + "…" : t("signIn")}
      </button>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <Link href={`/${locale}/reset-password`} className="hover:underline">
          {t("forgotPassword")}
        </Link>
        <Link href={`/${locale}/signup`} className="hover:underline">
          {t("noAccount")}
        </Link>
      </div>
    </form>
  );
}
