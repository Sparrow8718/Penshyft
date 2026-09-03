"use server";

import { db } from "@/lib/db/server";

export async function respondToOffer(token: string, action: "accept" | "decline") {
  const supa = db();

  const { data: offer } = await supa
    .from("shift_offer")
    .select("id, outcome, shift_id")
    .eq("token", token)
    .maybeSingle();

  if (!offer) return { error: "Offer not found." };
  if (offer.outcome) return { outcome: offer.outcome };

  if (action === "decline") {
    await supa
      .from("shift_offer")
      .update({ outcome: "declined", responded_at: new Date().toISOString() })
      .eq("id", offer.id);
    return { outcome: "declined" };
  }

  // Accept — use the DB function that handles race conditions
  const { data, error } = await supa.rpc("accept_shift_offer", {
    p_offer_id: offer.id,
  });

  if (error) return { error: error.message };

  if (data === 1) {
    return { outcome: "accepted" };
  }

  // data === 0 means shift was already filled
  const { data: refreshed } = await supa
    .from("shift_offer")
    .select("outcome")
    .eq("id", offer.id)
    .single();

  return { outcome: refreshed?.outcome ?? "filled_elsewhere" };
}
