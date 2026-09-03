import { getTranslations } from "next-intl/server";
import { LoginForm } from "./login-form";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: `${t("signIn")} · Penshyft` };
}

export default async function LoginPage() {
  const t = await getTranslations("auth");
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-center mb-4">{t("signIn")}</h2>
      <LoginForm />
    </div>
  );
}
