import { db } from "@/lib/db/server";

export async function shouldNotify(
  memberId: string,
  category: string,
): Promise<boolean> {
  const { data } = await db()
    .from("notification_pref")
    .select("enabled")
    .eq("member_id", memberId)
    .eq("channel", "email")
    .eq("category", category)
    .maybeSingle();

  return data?.enabled ?? true;
}
