import { getTranslations } from "next-intl/server";
import { Topbar } from "@/components/topbar";
import { SettingsNav } from "./settings-nav";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("settings");
  return (
    <>
      <Topbar title={t("title")} subtitle={t("subtitle")} />
      <div className="flex-1 flex flex-col">
        <SettingsNav />
        <div className="flex-1 px-6 py-6 max-w-3xl w-full">{children}</div>
      </div>
    </>
  );
}
