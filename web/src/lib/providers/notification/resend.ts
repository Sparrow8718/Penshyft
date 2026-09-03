import { Resend } from "resend";
import type { NotificationProvider, SendResult } from "@/lib/providers/types";

const resend = new Resend(process.env.RESEND_API_KEY);

export const resendNotificationProvider: NotificationProvider = {
  name: "resend",

  async sendEmail({ to, subject, body }): Promise<SendResult> {
    const from =
      process.env.RESEND_FROM_ADDRESS ?? "Penshyft <noreply@penshyft.com>";
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html: body,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, providerId: data?.id };
  },

  async sendPush(): Promise<SendResult> {
    return { ok: false, error: "Push not supported via Resend" };
  },
};
