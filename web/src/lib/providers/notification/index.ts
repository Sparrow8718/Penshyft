import type { NotificationProvider } from "@/lib/providers/types";

let cached: NotificationProvider | null = null;

export function getNotificationProvider(): NotificationProvider {
  if (cached) return cached;

  const mode = process.env.PROVIDER_MODE ?? "MOCK";

  if (mode === "LIVE") {
    const { resendNotificationProvider } = require("./resend");
    cached = resendNotificationProvider;
    return cached!;
  }

  const { mockNotificationProvider } = require("./mock");
  cached = mockNotificationProvider;
  return cached!;
}
