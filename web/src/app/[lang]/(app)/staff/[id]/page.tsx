import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/server";
import { StaffDetail } from "./staff-detail";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supa = db();
  const { data: s } = await supa
    .from("staff")
    .select("name")
    .eq("id", id)
    .maybeSingle();
  const t = await getTranslations("staff");
  return { title: `${s?.name ?? t("title")} · Penshyft` };
}

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getLocale();
  const session = await requireSession(locale);
  const supa = db();

  const { data: staffMember } = await supa
    .from("staff")
    .select("*")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .maybeSingle();

  if (!staffMember) notFound();

  const [{ data: shifts }, { data: swaps }, { data: roles }] = await Promise.all([
    supa
      .from("shift")
      .select("id, date, start_time, end_time, status")
      .eq("filled_by", id)
      .eq("site_id", session.siteId)
      .order("date", { ascending: false })
      .limit(20),
    supa
      .from("shift_swap")
      .select("id, status, created_at, shift_id")
      .or(`requester_id.eq.${id},target_id.eq.${id}`)
      .order("created_at", { ascending: false })
      .limit(20),
    supa
      .from("staff_role")
      .select("role_id, role:role(name, colour)")
      .eq("staff_id", id),
  ]);

  return (
    <StaffDetail
      staff={staffMember}
      shifts={shifts ?? []}
      swaps={swaps ?? []}
      roles={(roles ?? []).map((r: any) => ({
        id: r.role_id,
        name: r.role?.name ?? "",
        colour: r.role?.colour ?? null,
      }))}
    />
  );
}
