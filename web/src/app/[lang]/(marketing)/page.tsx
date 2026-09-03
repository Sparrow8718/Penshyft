import { getSession } from "@/lib/auth/session";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { FeatureGrid } from "./feature-grid";
import { PricingTable } from "./pricing-table";
import { ArrowRight } from "lucide-react";

export default async function LandingPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const t = await getTranslations("landing");
  const session = await getSession();

  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-24 sm:py-32 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
          {t("heroTitle")}
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {t("heroSubtitle")}
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          {session ? (
            <Link
              href={`/${lang}/dashboard`}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
            >
              {t("goToDashboard")}
              <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link
                href={`/${lang}/signup`}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
              >
                {t("getStarted")}
                <ArrowRight size={16} />
              </Link>
              <Link
                href={`/${lang}/login`}
                className="inline-flex items-center gap-2 rounded-md border border-border px-6 py-3 text-sm font-medium hover:bg-muted transition"
              >
                {t("login")}
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border/40 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-center">
            {t("featuresTitle")}
          </h2>
          <p className="mt-3 text-center text-muted-foreground max-w-xl mx-auto">
            {t("featuresSubtitle")}
          </p>
          <div className="mt-12">
            <FeatureGrid />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-center">
            {t("pricingTitle")}
          </h2>
          <p className="mt-3 text-center text-muted-foreground max-w-xl mx-auto">
            {t("pricingSubtitle")}
          </p>
          <div className="mt-12">
            <PricingTable />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border/40 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold">{t("ctaTitle")}</h2>
          <p className="mt-3 text-muted-foreground">{t("ctaSubtitle")}</p>
          <div className="mt-8">
            <Link
              href={session ? `/${lang}/dashboard` : `/${lang}/signup`}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
            >
              {session ? t("goToDashboard") : t("getStarted")}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
