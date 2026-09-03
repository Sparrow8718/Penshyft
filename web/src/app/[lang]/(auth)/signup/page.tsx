import { getTranslations } from "next-intl/server";
import { SignupForm } from "./signup-form";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: `${t("signUp")} · Penshyft` };
}

export default async function SignupPage() {
  const t = await getTranslations("auth");
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-center mb-4">{t("signUp")}</h2>
      <SignupForm />
    </div>
  );
}
