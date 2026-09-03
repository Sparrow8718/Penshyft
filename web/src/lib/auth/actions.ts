"use server";

import { redirect } from "next/navigation";
import { createAuthClient } from "@/lib/db/auth-server";

export async function signOut(locale = "en") {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect(`/${locale}/login`);
}
