import Link from "next/link";
import { db } from "@/lib/db/server";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supa = db();

  const { data: member } = await supa
    .from("member")
    .select("id, name, email, role, status, org_id, auth_user_id")
    .eq("invite_token", token)
    .single();

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="rounded-xl border border-border bg-card p-8 max-w-sm text-center">
          <h1 className="text-lg font-semibold mb-2">Invalid invite</h1>
          <p className="text-sm text-muted-foreground">
            This invite link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  if (member.auth_user_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="rounded-xl border border-border bg-card p-8 max-w-sm text-center">
          <h1 className="text-lg font-semibold mb-2">Already accepted</h1>
          <p className="text-sm text-muted-foreground mb-4">
            This invite has already been accepted.
          </p>
          <Link
            href="/en/login"
            className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const { data: org } = await supa
    .from("org")
    .select("name")
    .eq("id", member.org_id)
    .single();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="rounded-xl border border-border bg-card p-8 max-w-sm text-center">
        <h1 className="text-lg font-semibold mb-2">You're invited</h1>
        <p className="text-sm text-muted-foreground mb-1">
          Join <strong>{org?.name}</strong> on Penshyft
        </p>
        <p className="text-xs text-muted-foreground mb-6">
          Role: <strong>{member.role.replace("_", " ")}</strong>
        </p>
        <Link
          href={`/en/signup?invite=${token}`}
          className="inline-block rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
        >
          Create your account
        </Link>
      </div>
    </div>
  );
}
