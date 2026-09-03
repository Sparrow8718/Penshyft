import "server-only";
import { db } from "./server";
import { PLAN_LIMITS, type PlanKey } from "@/lib/billing/plans";

export type PlatformStats = {
  totalOrgs: number;
  totalMembers: number;
  totalStaff: number;
  planDistribution: { plan: string; count: number }[];
  signups: { date: string; count: number }[];
};

export type OrgListItem = {
  id: string;
  name: string;
  plan: string;
  industry: string;
  createdAt: string;
  staffCount: number;
  memberCount: number;
};

export type OrgDetailData = {
  id: string;
  name: string;
  plan: string;
  industry: string;
  areaLabel: string;
  createdAt: string;
  usage: {
    staff: { current: number; max: number };
    sites: { current: number; max: number };
    areas: { current: number; max: number };
  };
  sites: { id: string; name: string; address: string | null; staffCount: number; areaCount: number }[];
  members: { id: string; name: string; email: string; role: string }[];
};

export async function getPlatformStats(): Promise<PlatformStats> {
  const supa = db();

  const [orgsRes, membersRes, staffRes, planRes, signupsRes] = await Promise.all([
    supa.from("org").select("id", { count: "exact", head: true }),
    supa.from("member").select("id", { count: "exact", head: true }),
    supa.from("staff").select("id", { count: "exact", head: true }).eq("active", true).eq("archived", false),
    supa.from("org").select("plan"),
    supa.from("org").select("created_at").gte(
      "created_at",
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    ),
  ]);

  const planCounts = new Map<string, number>();
  for (const row of planRes.data ?? []) {
    planCounts.set(row.plan, (planCounts.get(row.plan) ?? 0) + 1);
  }

  const signupCounts = new Map<string, number>();
  for (const row of signupsRes.data ?? []) {
    const date = row.created_at.slice(0, 10);
    signupCounts.set(date, (signupCounts.get(date) ?? 0) + 1);
  }
  const signups = Array.from(signupCounts.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalOrgs: orgsRes.count ?? 0,
    totalMembers: membersRes.count ?? 0,
    totalStaff: staffRes.count ?? 0,
    planDistribution: Array.from(planCounts.entries()).map(([plan, count]) => ({ plan, count })),
    signups,
  };
}

export async function getOrgList(): Promise<OrgListItem[]> {
  const supa = db();

  const [orgsRes, staffRes, membersRes] = await Promise.all([
    supa.from("org").select("id, name, plan, industry, created_at").order("created_at", { ascending: false }),
    supa.from("staff").select("org_id").eq("active", true).eq("archived", false),
    supa.from("member").select("org_id"),
  ]);

  const orgs = orgsRes.data ?? [];
  const staffByOrg = new Map<string, number>();
  for (const s of staffRes.data ?? []) {
    staffByOrg.set(s.org_id, (staffByOrg.get(s.org_id) ?? 0) + 1);
  }
  const membersByOrg = new Map<string, number>();
  for (const m of membersRes.data ?? []) {
    membersByOrg.set(m.org_id, (membersByOrg.get(m.org_id) ?? 0) + 1);
  }

  return orgs.map((o) => ({
    id: o.id,
    name: o.name,
    plan: o.plan,
    industry: o.industry,
    createdAt: o.created_at,
    staffCount: staffByOrg.get(o.id) ?? 0,
    memberCount: membersByOrg.get(o.id) ?? 0,
  }));
}

export async function getOrgDetail(orgId: string): Promise<OrgDetailData | null> {
  const supa = db();

  const { data: org } = await supa
    .from("org")
    .select("id, name, plan, industry, area_label, created_at")
    .eq("id", orgId)
    .maybeSingle();

  if (!org) return null;

  const plan = (org.plan ?? "free") as PlanKey;
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

  const [sitesRes, membersRes, staffCountRes] = await Promise.all([
    supa.from("site").select("id, name, address").eq("org_id", orgId).eq("archived", false).order("created_at"),
    supa.from("member").select("id, name, email, role").eq("org_id", orgId).order("created_at"),
    supa
      .from("staff")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("active", true)
      .eq("archived", false),
  ]);

  const sites = sitesRes.data ?? [];
  const siteIds = sites.map((s) => s.id);

  let areaCount = 0;
  const staffBySite = new Map<string, number>();
  const areaBySite = new Map<string, number>();

  if (siteIds.length > 0) {
    const [areasRes, staffAreaRes] = await Promise.all([
      supa.from("area").select("site_id").in("site_id", siteIds).eq("archived", false),
      supa.from("staff_area").select("area_id, staff_id"),
    ]);

    for (const a of areasRes.data ?? []) {
      areaBySite.set(a.site_id, (areaBySite.get(a.site_id) ?? 0) + 1);
      areaCount++;
    }

    const areaToSite = new Map<string, string>();
    for (const a of areasRes.data ?? []) {
      areaToSite.set(a.site_id, a.site_id);
    }

    const staffSiteSet = new Map<string, Set<string>>();
    const areaRows = areasRes.data ?? [];
    const areaSiteMap = new Map<string, string>();
    for (const a of areaRows) {
      areaSiteMap.set(a.site_id, a.site_id);
    }

    const allAreas = await supa.from("area").select("id, site_id").in("site_id", siteIds).eq("archived", false);
    const areaIdToSite = new Map<string, string>();
    for (const a of allAreas.data ?? []) {
      areaIdToSite.set(a.id, a.site_id);
    }
    for (const sa of staffAreaRes.data ?? []) {
      const siteId = areaIdToSite.get(sa.area_id);
      if (siteId) {
        if (!staffSiteSet.has(siteId)) staffSiteSet.set(siteId, new Set());
        staffSiteSet.get(siteId)!.add(sa.staff_id);
      }
    }
    for (const [siteId, staffSet] of staffSiteSet) {
      staffBySite.set(siteId, staffSet.size);
    }
  }

  return {
    id: org.id,
    name: org.name,
    plan: org.plan,
    industry: org.industry,
    areaLabel: org.area_label,
    createdAt: org.created_at,
    usage: {
      staff: { current: staffCountRes.count ?? 0, max: limits.staff },
      sites: { current: sites.length, max: limits.sites },
      areas: { current: areaCount, max: limits.areas },
    },
    sites: sites.map((s) => ({
      id: s.id,
      name: s.name,
      address: s.address,
      staffCount: staffBySite.get(s.id) ?? 0,
      areaCount: areaBySite.get(s.id) ?? 0,
    })),
    members: (membersRes.data ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
    })),
  };
}
