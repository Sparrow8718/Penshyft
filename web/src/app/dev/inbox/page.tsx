import { listMessages, type StoredMessage } from "@/lib/dev/message-store";
import { clearAction, sendTestEmail } from "./actions";
import { revalidatePath } from "next/cache";
import { assertDevRoutesEnabled } from "@/lib/dev/guard";

export const dynamic = "force-dynamic";

export const metadata = { title: "Dev Inbox · Penshyft" };

export default async function DevInboxPage() {
  assertDevRoutesEnabled();
  const messages = await listMessages();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Local dev only
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Dev Inbox</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Every mock email and push notification lands here. Accept links inside
            email bodies are real localhost URLs — click them to test the fill flow
            end-to-end without spending a penny.
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await clearAction();
            revalidatePath("/dev/inbox");
          }}
        >
          <button
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition"
            type="submit"
          >
            Clear
          </button>
        </form>
      </header>

      <form
        action={async (fd: FormData) => {
          "use server";
          await sendTestEmail(
            String(fd.get("to") ?? ""),
            String(fd.get("subject") ?? ""),
            String(fd.get("body") ?? ""),
          );
          revalidatePath("/dev/inbox");
        }}
        className="mb-8 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_1fr_2fr_auto]"
      >
        <input
          name="to"
          defaultValue="staff@example.com"
          placeholder="To (email)"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          name="subject"
          defaultValue="Test notification"
          placeholder="Subject"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          name="body"
          defaultValue="This is what a real notification would look like."
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
        >
          Send test email
        </button>
      </form>

      {messages.length === 0 ? (
        <EmptyState />
      ) : (
        <ol className="space-y-4">
          {messages.map((m) => (
            <MessageBubble key={m.id} m={m} />
          ))}
        </ol>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
      <p className="text-sm text-muted-foreground">
        No messages yet. Post a shift or send a test above.
      </p>
    </div>
  );
}

function MessageBubble({ m }: { m: StoredMessage }) {
  const when = new Date(m.createdAt).toLocaleString("en-GB", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });
  return (
    <li className="grid gap-1 sm:grid-cols-[10rem_1fr]">
      <div className="pt-3 text-xs text-muted-foreground sm:text-right">
        <div className="font-medium text-foreground/80">{m.channel.toUpperCase()}</div>
        <div>{when}</div>
        <div className="truncate">{m.to}</div>
      </div>
      <div className="max-w-2xl rounded-2xl rounded-tl-sm bg-card border border-border p-4 shadow-sm">
        {m.subject && (
          <div className="mb-1 text-sm font-semibold">{m.subject}</div>
        )}
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {renderBodyWithLinks(m.body)}
        </div>
      </div>
    </li>
  );
}

function renderBodyWithLinks(body: string) {
  const parts = body.split(/(https?:\/\/[^\s)]+)/g);
  return parts.map((p, i) =>
    /^https?:\/\//.test(p) ? (
      <a
        key={i}
        href={p}
        className="text-primary underline underline-offset-2 break-all"
      >
        {p}
      </a>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}
