"use client";

import { useTranslations, useLocale } from "next-intl";
import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signup } from "./actions";
import { INDUSTRY_KEYS } from "@/lib/onboarding/industry-presets";

export function SignupForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("locale", locale);
    startTransition(async () => {
      const result = await signup(fd);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {inviteToken && <input type="hidden" name="invite" value={inviteToken} />}
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          {t("name")}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
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
          minLength={6}
          autoComplete="new-password"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      {!inviteToken && (
        <>
          <div>
            <label htmlFor="orgName" className="block text-sm font-medium mb-1">
              {t("orgName")}
            </label>
            <input
              id="orgName"
              name="orgName"
              type="text"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="industry" className="block text-sm font-medium mb-1">
              {t("industry")}
            </label>
            <select
              id="industry"
              name="industry"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {INDUSTRY_KEYS.map((key) => (
                <option key={key} value={key}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
      >
        {pending ? t("signUp") + "…" : t("signUp")}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        <Link href={`/${locale}/login`} className="hover:underline">
          {t("hasAccount")}
        </Link>
      </p>
    </form>
  );
}
