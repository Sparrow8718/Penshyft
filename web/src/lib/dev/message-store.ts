// File-backed JSON store for mock email/push during local dev.
// Used only while PROVIDER_MODE=MOCK. Mirrors message_log so
// /dev/inbox works even before the DB is running.

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", ".data")
  : path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "messages.json");

export type StoredMessage = {
  id: string;
  channel: "email" | "push";
  to: string;
  subject?: string;
  body: string;
  provider: string;
  orgId?: string;
  meta?: Record<string, unknown>;
  createdAt: string;                   // ISO
};

async function ensure(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(FILE);
  } catch {
    await fs.writeFile(FILE, "[]", "utf8");
  }
}

export async function listMessages(): Promise<StoredMessage[]> {
  await ensure();
  const raw = await fs.readFile(FILE, "utf8");
  try {
    const parsed = JSON.parse(raw) as StoredMessage[];
    return parsed.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

export async function appendMessage(
  m: Omit<StoredMessage, "id" | "createdAt">,
): Promise<StoredMessage> {
  await ensure();
  const all = await listMessages();
  const row: StoredMessage = {
    ...m,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };
  all.unshift(row);
  await fs.writeFile(FILE, JSON.stringify(all, null, 2), "utf8");
  return row;
}

export async function clearMessages(): Promise<void> {
  await ensure();
  await fs.writeFile(FILE, "[]", "utf8");
}
