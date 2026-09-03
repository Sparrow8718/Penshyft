"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/server";

export async function cancelSwapRequest(token: string) {
  const supa = db();

  const { data: swap } = await supa
    .from("shift_swap")
    .select("id, status")
    .eq("token", token)
    .single();

  if (!swap) return { error: "Swap request not found." };
  if (swap.status !== "pending") return { error: "Swap is no longer pending." };

  await supa
    .from("shift_swap")
    .update({
      status: "cancelled",
      resolved_at: new Date().toISOString(),
    })
    .eq("id", swap.id);

  revalidatePath(`/swap/${token}`);
  return {};
}
