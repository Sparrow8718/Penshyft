import { getLocale } from "next-intl/server";
import { requireSession } from "@/lib/auth/session";
import { SessionProvider } from "@/lib/auth/context";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { db } from "@/lib/db/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const session = await requireSession(locale);

  const supa = db();
  const { data: sites } = await supa
    .from("site")
    .select("id, name")
    .eq("org_id", session.orgId)
    .eq("archived", false)
    .order("created_at");

  return (
    <SessionProvider session={session} sites={sites ?? []}>
      <div className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
          <ImpersonationBanner />
          {children}
        </main>
        <MobileNav />
      </div>
    </SessionProvider>
  );
}
