"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/server";
import { getSession } from "@/lib/auth/session";
import { roleInOrg } from "@/lib/auth/guards";

export async function createRole(formData: FormData) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };

  const name = (formData.get("name") as string).trim();
  const colour = formData.get("colour") as string;

  if (!name) return { error: "Name is required." };

  const supa = db();
  const { error } = await supa.from("role").insert({ org_id: s.orgId, name, colour });
  if (error) return { error: error.message };

  revalidatePath("/settings/roles");
  return {};
}

export async function updateRole(formData: FormData) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };

  const roleId = formData.get("roleId") as string;
  const name = (formData.get("name") as string).trim();
  const colour = formData.get("colour") as string;

  if (!name) return { error: "Name is required." };
  if (!(await roleInOrg(roleId, s.orgId))) return { error: "Role not found." };

  const supa = db();
  const { error } = await supa
    .from("role")
    .update({ name, colour })
    .eq("id", roleId)
    .eq("org_id", s.orgId);
  if (error) return { error: error.message };

  revalidatePath("/settings/roles");
  return {};
}

export async function archiveRole(roleId: string) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };
  if (!(await roleInOrg(roleId, s.orgId))) return { error: "Role not found." };

  const supa = db();
  await supa.from("role").update({ archived: true }).eq("id", roleId).eq("org_id", s.orgId);
  revalidatePath("/settings/roles");
  return {};
}
