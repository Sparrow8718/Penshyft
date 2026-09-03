"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, FileText, User } from "lucide-react";

type Shift = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
};

type Swap = {
  id: string;
  status: string;
  created_at: string;
  shift_id: string;
};

type RoleRef = { id: string; name: string; colour: string | null };

type Staff = {
  id: string;
  name: string;
  email: string | null;
  mobile: string | null;
  notes: string | null;
  active: boolean;
};

export function StaffDetail({
  staff,
  shifts,
  swaps,
  roles,
}: {
  staff: Staff;
  shifts: Shift[];
  swaps: Swap[];
  roles: RoleRef[];
}) {
  const t = useTranslations("staff");
  const locale = useLocale();

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <Link
        href={`/${locale}/staff`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft size={14} />
        {t("title")}
      </Link>

      {/* Overview */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">{staff.name}</h1>
            {!staff.active && (
              <span className="text-xs text-muted-foreground uppercase">
                Inactive
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-2 text-sm">
          {staff.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail size={14} />
              <span>{staff.email}</span>
            </div>
          )}
          {staff.mobile && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone size={14} />
              <span>{staff.mobile}</span>
            </div>
          )}
          {staff.notes && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText size={14} />
              <span>{staff.notes}</span>
            </div>
          )}
        </div>

        {roles.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {roles.map((r) => (
              <Badge key={r.id} colour={r.colour ?? undefined}>
                {r.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Shift History */}
      <section>
        <h2 className="text-sm font-semibold mb-3">{t("shiftHistory")}</h2>
        {shifts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noShiftHistory")}</p>
        ) : (
          <div className="space-y-1.5">
            {shifts.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
              >
                <span>{s.date}</span>
                <span className="text-muted-foreground">
                  {s.start_time}–{s.end_time}
                </span>
                <Badge>{s.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Swap History */}
      <section>
        <h2 className="text-sm font-semibold mb-3">{t("swapHistory")}</h2>
        {swaps.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noSwapHistory")}</p>
        ) : (
          <div className="space-y-1.5">
            {swaps.map((sw) => (
              <div
                key={sw.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
              >
                <span className="text-muted-foreground">
                  {new Date(sw.created_at).toLocaleDateString()}
                </span>
                <Badge>{sw.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
