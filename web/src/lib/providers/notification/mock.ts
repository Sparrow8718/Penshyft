import type { NotificationProvider, SendResult } from "@/lib/providers/types";
import { appendMessage } from "@/lib/dev/message-store";

export const mockNotificationProvider: NotificationProvider = {
  name: "mock",

  async sendEmail({ to, subject, body, orgId, meta }): Promise<SendResult> {
    const row = await appendMessage({
      channel: "email",
      to,
      subject,
      body,
      provider: "mock",
      orgId,
      meta,
    });
    console.log(`[mock-email] → ${to} — ${subject}\n(id=${row.id})`);
    return { ok: true, providerId: row.id };
  },

  async sendPush({ to, title, body, url, orgId, meta }): Promise<SendResult> {
    const row = await appendMessage({
      channel: "push",
      to,
      subject: title,
      body: url ? `${body}\n\n${url}` : body,
      provider: "mock",
      orgId,
      meta,
    });
    console.log(`[mock-push] → ${to} — ${title}\n(id=${row.id})`);
    return { ok: true, providerId: row.id };
  },
};
