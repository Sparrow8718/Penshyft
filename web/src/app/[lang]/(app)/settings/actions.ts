"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/server";
import { requireSession } from "@/lib/auth/session";

export async function updateOrg(formData: FormData) {
  const session = await requireSession();

  const name = (formData.get("name") as string).trim();
  const industry = formData.get("industry") as string;
  const areaLabel = (formData.get("areaLabel") as string).trim();

  if (!name) return { error: "Name is required." };
  if (!areaLabel) return { error: "Area label is required." };

  const horizonUnit = formData.get("generationHorizonUnit") as string | null;
  const horizonValue = Number(formData.get("generationHorizonValue"));

  const supa = db();
  const { error } = await supa
    .from("org")
    .update({
      name,
      industry,
      area_label: areaLabel,
      ...(horizonUnit === "days" || horizonUnit === "months"
        ? { generation_horizon_unit: horizonUnit }
        : {}),
      ...(horizonValue >= 1 && horizonValue <= 365
        ? { generation_horizon_value: horizonValue }
        : {}),
    })
    .eq("id", session.orgId);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return {};
}
