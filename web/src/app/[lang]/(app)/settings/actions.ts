"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/server";

export async function updateOrg(formData: FormData) {
  const orgId = formData.get("orgId") as string;
  const name = (formData.get("name") as string).trim();
  const industry = formData.get("industry") as string;
  const areaLabel = (formData.get("areaLabel") as string).trim();

  if (!name) return { error: "Name is required." };
  if (!areaLabel) return { error: "Area label is required." };

  const supa = db();
  const { error } = await supa
    .from("org")
    .update({ name, industry, area_label: areaLabel })
    .eq("id", orgId);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return {};
}
