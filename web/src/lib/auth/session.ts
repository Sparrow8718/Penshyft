import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAuthClient } from "@/lib/db/auth-server";
import { db } from "@/lib/db/server";

export type Session = {
  userId: string;
  email: string;
  memberId: string;
  memberName: string;
  role: string;
  orgId: string;
  orgName: string;
  orgPlan: string;
  orgIndustry: string;
  orgAreaLabel: string;
  siteId: string;
  siteName: string;
  isImpersonating: boolean;
  realOrgId: string;
  realOrgName: string;
};

export async function getSession(): Promise<Session | null> {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const supa = db();
  const { data: member } = await supa
    .from("member")
    .select("id, name, role, org_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!member) return null;

  const { data: org } = await supa
    .from("org")
    .select("name, plan, industry, area_label")
    .eq("id", member.org_id)
    .single();

  let activeOrgId = member.org_id;
  let activeOrgName = org?.name ?? "";
  let activeOrgPlan = org?.plan ?? "free";
  let activeOrgIndustry = org?.industry ?? "other";
  let activeOrgAreaLabel = org?.area_label ?? "Area";
  let isImpersonating = false;

  const jar = await cookies();

  // Impersonation: system_admin can view as another org
  const impersonateOrgId = jar.get("sf-impersonate-org")?.value;
  if (impersonateOrgId && member.role === "system_admin") {
    const { data: targetOrg } = await supa
      .from("org")
      .select("id, name, plan, industry, area_label")
      .eq("id", impersonateOrgId)
      .maybeSingle();

    if (targetOrg) {
      activeOrgId = targetOrg.id;
      activeOrgName = targetOrg.name;
      activeOrgPlan = targetOrg.plan;
      activeOrgIndustry = targetOrg.industry;
      activeOrgAreaLabel = targetOrg.area_label;
      isImpersonating = true;
    }
  }

  const preferredSiteId = jar.get("sf-site-id")?.value;

  let site: { id: string; name: string } | null = null;

  if (preferredSiteId) {
    const { data } = await supa
      .from("site")
      .select("id, name")
      .eq("id", preferredSiteId)
      .eq("org_id", activeOrgId)
      .eq("archived", false)
      .maybeSingle();
    site = data;
  }

  if (!site) {
    const { data } = await supa
      .from("site")
      .select("id, name")
      .eq("org_id", activeOrgId)
      .eq("archived", false)
      .order("created_at")
      .limit(1)
      .maybeSingle();
    site = data;
  }

  return {
    userId: user.id,
    email: user.email ?? "",
    memberId: member.id,
    memberName: member.name,
    role: member.role,
    orgId: activeOrgId,
    orgName: activeOrgName,
    orgPlan: activeOrgPlan,
    orgIndustry: activeOrgIndustry,
    orgAreaLabel: activeOrgAreaLabel,
    siteId: site?.id ?? "",
    siteName: site?.name ?? "",
    isImpersonating,
    realOrgId: member.org_id,
    realOrgName: org?.name ?? "",
  };
}

export async function requireSession(locale = "en"): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);
  return session;
}
