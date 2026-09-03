"use server";

import { getNotificationProvider } from "@/lib/providers/notification";
import { clearMessages } from "@/lib/dev/message-store";
import { devRoutesEnabled } from "@/lib/dev/guard";

export async function sendTestEmail(to: string, subject: string, body: string) {
  if (!devRoutesEnabled()) return;
  if (!to || !body) return;
  const provider = getNotificationProvider();
  await provider.sendEmail({ to, subject: subject || "Test email", body });
}

export async function sendTestPush(to: string, title: string, body: string) {
  if (!devRoutesEnabled()) return;
  if (!to || !body) return;
  const provider = getNotificationProvider();
  await provider.sendPush({ to, title: title || "Test push", body });
}

export async function clearAction() {
  if (!devRoutesEnabled()) return;
  await clearMessages();
}
