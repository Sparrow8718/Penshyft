"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/server";

const CATEGORIES = ["shift_offer", "swap_request", "swap_resolved", "team_invite"] as const;
export type NotifCategory = (typeof CATEGORIES)[number];

export async function updateNotificationPrefs(
  prefs: { category: NotifCategory; enabled: boolean }[],
) {
  const session = await requireSession();
  const supa = db();

  for (const { category, enabled } of prefs) {
    if (!CATEGORIES.includes(category)) continue;

    await supa
      .from("notification_pref")
      .upsert(
        {
          member_id: session.memberId,
          channel: "email",
          category,
          enabled,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "member_id,channel,category" },
      );
  }

  revalidatePath("/settings/notifications");
  return { ok: true };
}
