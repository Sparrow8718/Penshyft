"use server";

import { redirect } from "next/navigation";
import { createAuthClient } from "@/lib/db/auth-server";
import { db } from "@/lib/db/server";
import { INDUSTRIES } from "@/lib/onboarding/industry-presets";

export async function signup(formData: FormData) {
  const name = (formData.get("name") as string).trim();
  const email = (formData.get("email") as string).trim().toLowerCase();
  const password = formData.get("password") as string;
  const locale = (formData.get("locale") as string) || "en";
  const inviteToken = (formData.get("invite") as string)?.trim() || null;

  const supabase = await createAuthClient();
  const supa = db();

  // Invite-based signup: join an existing org
  if (inviteToken) {
    if (!name || !email || !password) {
      return { error: "Name, email, and password are required." };
    }

    const { data: pending } = await supa
      .from("member")
      .select("id, org_id, email")
      .eq("invite_token", inviteToken)
      .eq("status", "pending")
      .single();

    if (!pending) return { error: "Invalid or expired invite." };

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: pending.email,
      password,
      options: { data: { full_name: name } },
    });

    if (authError) return { error: authError.message };
    if (!authData.user) return { error: "Signup failed." };

    const { error: updateError } = await supa
      .from("member")
      .update({
        auth_user_id: authData.user.id,
        name,
        status: "active",
        invite_token: null,
      })
      .eq("id", pending.id);

    if (updateError) return { error: updateError.message };

    redirect(`/${locale}/dashboard`);
  }

  // Standard signup: create a new org
  const orgName = (formData.get("orgName") as string).trim();
  const industry = formData.get("industry") as string;

  if (!name || !email || !password || !orgName || !industry) {
    return { error: "All fields are required." };
  }

  const preset = INDUSTRIES[industry] ?? INDUSTRIES.other;

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });

  if (authError) return { error: authError.message };
  if (!authData.user) return { error: "Signup failed." };

  const { data: org, error: orgError } = await supa
    .from("org")
    .insert({
      name: orgName,
      industry,
      area_label: preset.areaLabel,
      plan: "free",
    })
    .select("id")
    .single();

  if (orgError) return { error: orgError.message };

  const { data: site, error: siteError } = await supa
    .from("site")
    .insert({
      org_id: org.id,
      name: `${orgName} ${preset.defaultSiteSuffix}`,
    })
    .select("id")
    .single();

  if (siteError) return { error: siteError.message };

  const { error: areaError } = await supa
    .from("area")
    .insert({ site_id: site.id, name: preset.defaultArea });

  if (areaError) return { error: areaError.message };

  const { error: memberError } = await supa
    .from("member")
    .insert({
      org_id: org.id,
      auth_user_id: authData.user.id,
      name,
      email,
      role: "org_admin",
    });

  if (memberError) return { error: memberError.message };

  if (preset.roles.length > 0) {
    const roleRows = preset.roles.map((r) => ({
      org_id: org.id,
      name: r.name,
      colour: r.colour,
    }));
    await supa.from("role").insert(roleRows);
  }

  redirect(`/${locale}/dashboard`);
}
