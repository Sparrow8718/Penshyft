"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  LayoutDashboard,
  CalendarClock,
  ListChecks,
  Users,
  Settings,
  Inbox,
  Sparkles,
  LogOut,
  History,
  ArrowLeftRight,
  FileBarChart,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth/context";
import { signOut } from "@/lib/auth/actions";
import { SitePicker } from "@/components/site-picker";

type NavItem = {
  path: string;
  labelKey: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const nav: NavItem[] = [
  { path: "/dashboard", labelKey: "today", icon: LayoutDashboard },
  { path: "/rota",      labelKey: "rota",  icon: CalendarClock },
  { path: "/shifts",    labelKey: "shifts", icon: ListChecks },
  { path: "/staff",     labelKey: "staff",  icon: Users },
  { path: "/swaps",     labelKey: "swaps",    icon: ArrowLeftRight },
  { path: "/reports",   labelKey: "reports",  icon: FileBarChart },
  { path: "/activity",  labelKey: "activity", icon: History },
  { path: "/settings",  labelKey: "settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("nav");
  const session = useSession();

  return (
    <aside className="hidden lg:flex lg:w-60 lg:shrink-0 lg:flex-col border-r border-border bg-card/40">
      <div className="flex items-center gap-2 px-5 h-14 border-b border-border">
        <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
          <Sparkles size={16} />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">Penshyft</div>
          <div className="text-[11px] text-muted-foreground truncate max-w-[140px]">
            {session.orgName}
          </div>
        </div>
      </div>

      <SitePicker />

      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {nav.map((item) => {
            const href = `/${locale}${item.path}`;
            return (
              <NavLink
                key={item.path}
                href={href}
                label={t(item.labelKey)}
                icon={item.icon}
                active={isActive(pathname, href)}
              />
            );
          })}
        </ul>

        {session.role === "system_admin" && (
          <div className="mt-8">
            <div className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("platform")}
            </div>
            <ul className="space-y-1">
              <NavLink
                href={`/${locale}/admin`}
                label={t("admin")}
                icon={Shield}
                active={isActive(pathname, `/${locale}/admin`)}
              />
            </ul>
          </div>
        )}

        {process.env.NODE_ENV === "development" && (
          <div className="mt-8">
            <div className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("development")}
            </div>
            <ul className="space-y-1">
              <NavLink
                href="/dev/inbox"
                label={t("devInbox")}
                icon={Inbox}
                active={isActive(pathname, "/dev/inbox")}
              />
            </ul>
          </div>
        )}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2 px-2 pb-2">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium truncate">{session.memberName}</div>
            <div className="text-[11px] text-muted-foreground truncate">{session.email}</div>
          </div>
          <form action={() => signOut(locale)}>
            <button
              type="submit"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition"
              title={t("signOut") ?? "Sign out"}
            >
              <LogOut size={14} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href.endsWith("/dashboard")) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  active: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
          active
            ? "bg-accent text-foreground font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
        )}
      >
        <Icon size={16} className={cn(active ? "text-primary" : "")} />
        <span>{label}</span>
      </Link>
    </li>
  );
}
