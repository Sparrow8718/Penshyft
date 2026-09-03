"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/server";

export async function switchSite(siteId: string) {
  const session = await requireSession();

  const supa = db();
  const { data: site } = await supa
    .from("site")
    .select("id")
    .eq("id", siteId)
    .eq("org_id", session.orgId)
    .eq("archived", false)
    .maybeSingle();

  if (!site) return { error: "Site not found" };

  const jar = await cookies();
  jar.set("sf-site-id", siteId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/");
  return { ok: true };
}
