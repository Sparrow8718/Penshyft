"use server";

import { createAuthClient } from "@/lib/db/auth-server";

export async function requestReset(formData: FormData) {
  const email = (formData.get("email") as string).trim().toLowerCase();
  if (!email) return { error: "Email is required." };

  const supabase = await createAuthClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  });

  if (error) return { error: error.message };
  return {};
}
