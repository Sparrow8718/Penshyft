"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  ListChecks,
  Users,
  Settings,
  MoreHorizontal,
  CalendarClock,
  ArrowLeftRight,
  FileBarChart,
  History,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth/context";

const primary = [
  { path: "/dashboard", labelKey: "today", icon: LayoutDashboard },
  { path: "/shifts", labelKey: "shifts", icon: ListChecks },
  { path: "/staff", labelKey: "staff", icon: Users },
  { path: "/settings", labelKey: "settings", icon: Settings },
] as const;

const more = [
  { path: "/rota", labelKey: "rota", icon: CalendarClock },
  { path: "/swaps", labelKey: "swaps", icon: ArrowLeftRight },
  { path: "/reports", labelKey: "reports", icon: FileBarChart },
  { path: "/activity", labelKey: "activity", icon: History },
] as const;

export function MobileNav() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("nav");
  const session = useSession();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const isMoreActive = more.some((item) => {
    const href = `/${locale}${item.path}`;
    return pathname === href || pathname.startsWith(href + "/");
  });

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function isActive(path: string) {
    const href = `/${locale}${path}`;
    if (path === "/dashboard") return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 safe-bottom">
      {session.sites.length > 1 && (
        <div className="text-center text-[10px] text-muted-foreground pt-1 -mb-0.5 truncate px-4">
          {session.siteName}
        </div>
      )}
      {open && (
        <div ref={panelRef} className="absolute bottom-full inset-x-0 border-t border-border bg-card shadow-lg">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground">{t("more")}</span>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition"
            >
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1 p-3">
            {more.map((item) => {
              const href = `/${locale}${item.path}`;
              const active = isActive(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 py-3 rounded-lg text-[11px] transition",
                    active
                      ? "text-primary font-medium bg-accent"
                      : "text-muted-foreground hover:bg-accent/60",
                  )}
                >
                  <Icon size={20} />
                  <span>{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-stretch justify-around h-14">
        {primary.map((item) => {
          const href = `/${locale}${item.path}`;
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 text-[10px] transition",
                active ? "text-primary font-medium" : "text-muted-foreground",
              )}
            >
              <Icon size={18} />
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 flex-1 text-[10px] transition",
            open || isMoreActive ? "text-primary font-medium" : "text-muted-foreground",
          )}
        >
          <MoreHorizontal size={18} />
          <span>{t("more")}</span>
        </button>
      </div>
    </nav>
  );
}
