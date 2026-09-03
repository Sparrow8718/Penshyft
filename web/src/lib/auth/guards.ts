import "server-only";
import { db } from "@/lib/db/server";

// Tenant-ownership guards. The app talks to Supabase with the service-role
// key (RLS is bypassed), so every mutation must prove the target row belongs
// to the caller's org in application code. Callers derive orgId from the
// session (never from client input) and pass it here.

export async function getOrgSiteIds(orgId: string): Promise<string[]> {
  const { data } = await db().from("site").select("id").eq("org_id", orgId);
  return (data ?? []).map((s) => s.id as string);
}

export async function siteInOrg(siteId: string, orgId: string): Promise<boolean> {
  if (!siteId) return false;
  const { data } = await db()
    .from("site")
    .select("id")
    .eq("id", siteId)
    .eq("org_id", orgId)
    .maybeSingle();
  return !!data;
}

export async function staffInOrg(staffId: string, orgId: string): Promise<boolean> {
  if (!staffId) return false;
  const { data } = await db()
    .from("staff")
    .select("id")
    .eq("id", staffId)
    .eq("org_id", orgId)
    .maybeSingle();
  return !!data;
}

export async function roleInOrg(roleId: string, orgId: string): Promise<boolean> {
  if (!roleId) return false;
  const { data } = await db()
    .from("role")
    .select("id")
    .eq("id", roleId)
    .eq("org_id", orgId)
    .maybeSingle();
  return !!data;
}

export async function allRolesInOrg(roleIds: string[], orgId: string): Promise<boolean> {
  const unique = [...new Set(roleIds)];
  if (unique.length === 0) return true;
  const { data } = await db().from("role").select("id").in("id", unique).eq("org_id", orgId);
  return (data?.length ?? 0) === unique.length;
}

export async function allAreasInOrg(areaIds: string[], orgId: string): Promise<boolean> {
  const unique = [...new Set(areaIds)];
  if (unique.length === 0) return true;
  const siteIds = await getOrgSiteIds(orgId);
  if (siteIds.length === 0) return false;
  const { data } = await db().from("area").select("id").in("id", unique).in("site_id", siteIds);
  return (data?.length ?? 0) === unique.length;
}

export async function areaInOrg(areaId: string, orgId: string): Promise<boolean> {
  if (!areaId) return true; // null/empty area is allowed
  return allAreasInOrg([areaId], orgId);
}

export async function shiftInOrg(shiftId: string, orgId: string): Promise<boolean> {
  if (!shiftId) return false;
  const siteIds = await getOrgSiteIds(orgId);
  if (siteIds.length === 0) return false;
  const { data } = await db()
    .from("shift")
    .select("id")
    .eq("id", shiftId)
    .in("site_id", siteIds)
    .maybeSingle();
  return !!data;
}
