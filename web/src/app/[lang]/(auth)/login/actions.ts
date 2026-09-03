"use server";

import { redirect } from "next/navigation";
import { createAuthClient } from "@/lib/db/auth-server";

export async function login(formData: FormData, next: string) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createAuthClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect(next);
}
