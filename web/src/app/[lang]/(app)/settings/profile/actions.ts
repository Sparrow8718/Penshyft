"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/server";
import { createAuthClient } from "@/lib/db/auth-server";
import { getSession } from "@/lib/auth/session";

export async function updateName(formData: FormData) {
  const name = (formData.get("name") as string).trim();
  if (!name) return { error: "Name is required." };

  const s = await getSession();
  if (!s) return { error: "Not authenticated." };

  const supa = db();
  const { error } = await supa
    .from("member")
    .update({ name })
    .eq("id", s.memberId);

  if (error) return { error: error.message };

  revalidatePath("/settings/profile");
  return { success: true };
}

export async function updateEmail(formData: FormData) {
  const email = (formData.get("email") as string).trim().toLowerCase();
  if (!email) return { error: "Email is required." };

  const s = await getSession();
  if (!s) return { error: "Not authenticated." };

  const supabase = await createAuthClient();
  const { error: authError } = await supabase.auth.updateUser({ email });
  if (authError) return { error: authError.message };

  const supa = db();
  await supa.from("member").update({ email }).eq("id", s.memberId);

  revalidatePath("/settings/profile");
  return { success: true };
}

export async function changePassword(formData: FormData) {
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  if (!password || password.length < 6) return { error: "Password must be at least 6 characters." };
  if (password !== confirm) return { error: "Passwords do not match." };

  const s = await getSession();
  if (!s) return { error: "Not authenticated." };

  const supabase = await createAuthClient();
  const { error: authError } = await supabase.auth.updateUser({ password });
  if (authError) return { error: authError.message };

  return { success: true };
}
