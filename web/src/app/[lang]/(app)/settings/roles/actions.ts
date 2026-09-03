"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/server";

export async function createRole(formData: FormData) {
  const orgId = formData.get("orgId") as string;
  const name = (formData.get("name") as string).trim();
  const colour = formData.get("colour") as string;

  if (!name) return { error: "Name is required." };

  const supa = db();
  const { error } = await supa.from("role").insert({ org_id: orgId, name, colour });
  if (error) return { error: error.message };

  revalidatePath("/settings/roles");
  return {};
}

export async function updateRole(formData: FormData) {
  const roleId = formData.get("roleId") as string;
  const name = (formData.get("name") as string).trim();
  const colour = formData.get("colour") as string;

  if (!name) return { error: "Name is required." };

  const supa = db();
  const { error } = await supa.from("role").update({ name, colour }).eq("id", roleId);
  if (error) return { error: error.message };

  revalidatePath("/settings/roles");
  return {};
}

export async function archiveRole(roleId: string) {
  const supa = db();
  await supa.from("role").update({ archived: true }).eq("id", roleId);
  revalidatePath("/settings/roles");
}
