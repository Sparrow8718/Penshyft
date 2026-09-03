"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/server";
import { logAudit } from "@/lib/db/audit";
import { getSession } from "@/lib/auth/session";
import { getNotificationProvider } from "@/lib/providers/notification";
import { teamInviteEmail } from "@/lib/emails/templates";

const ALLOWED_ROLES = [
  "org_admin",
  "org_manager",
  "site_manager",
  "supervisor",
  "user",
];

export async function inviteMember(formData: FormData) {
  const email = (formData.get("email") as string).trim().toLowerCase();
  const role = formData.get("role") as string;

  if (!email) return { error: "Email is required." };
  if (!ALLOWED_ROLES.includes(role)) return { error: "Invalid role." };

  const s = await getSession();
  if (!s) return { error: "Not authenticated." };

  const supa = db();

  const { data: existing } = await supa
    .from("member")
    .select("id, status")
    .eq("org_id", s.orgId)
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    if (existing.status === "active") return { error: "This person is already a member." };
    if (existing.status === "pending") return { error: "An invite is already pending for this email." };
  }

  const token = randomBytes(24).toString("base64url");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { error } = await supa.from("member").insert({
    org_id: s.orgId,
    email,
    name: email.split("@")[0],
    role,
    status: "pending",
    invite_token: token,
    invited_by: s.memberId,
    invited_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };

  const notifier = getNotificationProvider();
  await notifier.sendEmail({
    to: email,
    subject: `You're invited to join ${s.orgName} on Penshyft`,
    body: teamInviteEmail({
      inviteeName: "",
      orgName: s.orgName,
      inviterName: s.memberName,
      acceptUrl: `${appUrl}/invite/${token}`,
      role: role.replace("_", " "),
    }),
    orgId: s.orgId,
  });

  logAudit({
    orgId: s.orgId,
    actor: s.memberName,
    action: "member.invited",
    meta: { email, role },
  });

  revalidatePath("/settings/members");
  return {};
}

export async function changeRole(memberId: string, newRole: string) {
  if (!ALLOWED_ROLES.includes(newRole)) return { error: "Invalid role." };

  const s = await getSession();
  if (!s) return { error: "Not authenticated." };
  if (s.memberId === memberId) return { error: "You cannot change your own role." };

  const supa = db();
  const { error } = await supa
    .from("member")
    .update({ role: newRole })
    .eq("id", memberId)
    .eq("org_id", s.orgId);

  if (error) return { error: error.message };

  logAudit({
    orgId: s.orgId,
    actor: s.memberName,
    action: "member.role_changed",
    entity: `member:${memberId}`,
    meta: { newRole },
  });

  revalidatePath("/settings/members");
  return {};
}

export async function deactivateMember(memberId: string) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };
  if (s.memberId === memberId) return { error: "You cannot deactivate yourself." };

  const supa = db();
  const { error } = await supa
    .from("member")
    .update({ status: "deactivated" })
    .eq("id", memberId)
    .eq("org_id", s.orgId);

  if (error) return { error: error.message };

  logAudit({
    orgId: s.orgId,
    actor: s.memberName,
    action: "member.deactivated",
    entity: `member:${memberId}`,
  });

  revalidatePath("/settings/members");
  return {};
}

export async function resendInvite(memberId: string) {
  const s = await getSession();
  if (!s) return { error: "Not authenticated." };

  const supa = db();
  const token = randomBytes(24).toString("base64url");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { data: member, error: fetchErr } = await supa
    .from("member")
    .select("id, email, role, status")
    .eq("id", memberId)
    .eq("org_id", s.orgId)
    .single();

  if (fetchErr || !member) return { error: "Member not found." };
  if (member.status !== "pending") return { error: "Only pending members can be re-invited." };

  await supa
    .from("member")
    .update({ invite_token: token, invited_at: new Date().toISOString() })
    .eq("id", memberId);

  const notifier = getNotificationProvider();
  await notifier.sendEmail({
    to: member.email,
    subject: `You're invited to join ${s.orgName} on Penshyft`,
    body: teamInviteEmail({
      inviteeName: "",
      orgName: s.orgName,
      inviterName: s.memberName,
      acceptUrl: `${appUrl}/invite/${token}`,
      role: member.role.replace("_", " "),
    }),
    orgId: s.orgId,
  });

  revalidatePath("/settings/members");
  return {};
}
