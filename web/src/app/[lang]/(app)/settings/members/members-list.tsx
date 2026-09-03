"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, UserX } from "lucide-react";
import { inviteMember, changeRole, deactivateMember, resendInvite } from "./actions";

type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  invited_at: string | null;
};

const ROLE_OPTIONS = [
  { value: "org_admin", label: "Org Admin" },
  { value: "org_manager", label: "Org Manager" },
  { value: "site_manager", label: "Site Manager" },
  { value: "supervisor", label: "Supervisor" },
  { value: "user", label: "User" },
];

export function MembersList({
  members,
  currentMemberId,
}: {
  members: Member[];
  currentMemberId: string;
}) {
  const tc = useTranslations("common");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await inviteMember(fd);
      if (res?.error) setError(res.error);
      else setDialogOpen(false);
    });
  }

  function handleRoleChange(memberId: string, newRole: string) {
    startTransition(async () => {
      const res = await changeRole(memberId, newRole);
      if (res?.error) setError(res.error);
    });
  }

  function handleDeactivate(memberId: string) {
    startTransition(async () => {
      const res = await deactivateMember(memberId);
      if (res?.error) setError(res.error);
    });
  }

  function handleResend(memberId: string) {
    startTransition(async () => {
      const res = await resendInvite(memberId);
      if (res?.error) setError(res.error);
    });
  }

  const statusColor: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-600",
    pending: "bg-amber-500/10 text-amber-600",
    deactivated: "bg-zinc-500/10 text-zinc-500",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Team members</h2>
        <Button
          variant="secondary"
          className="h-8 text-xs"
          onClick={() => { setError(null); setDialogOpen(true); }}
        >
          <Plus size={14} /> Invite
        </Button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="space-y-2">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">
                {m.name}
                {m.id === currentMemberId && (
                  <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground truncate">{m.email}</div>
            </div>

            <Badge className={statusColor[m.status] ?? ""}>
              {m.status}
            </Badge>

            {m.id !== currentMemberId && m.status !== "deactivated" && (
              <select
                value={m.role}
                onChange={(e) => handleRoleChange(m.id, e.target.value)}
                disabled={pending}
                className="h-7 rounded-md border border-border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            )}

            {m.id === currentMemberId && (
              <span className="text-xs text-muted-foreground capitalize">
                {m.role.replace("_", " ")}
              </span>
            )}

            {m.status === "deactivated" && m.id !== currentMemberId && (
              <span className="text-xs text-muted-foreground capitalize">
                {m.role.replace("_", " ")}
              </span>
            )}

            <div className="flex gap-1">
              {m.status === "pending" && (
                <button
                  onClick={() => handleResend(m.id)}
                  disabled={pending}
                  title="Resend invite"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition disabled:opacity-50"
                >
                  <RefreshCw size={13} />
                </button>
              )}
              {m.id !== currentMemberId && m.status !== "deactivated" && (
                <button
                  onClick={() => handleDeactivate(m.id)}
                  disabled={pending}
                  title="Deactivate member"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-danger hover:bg-accent transition disabled:opacity-50"
                >
                  <UserX size={13} />
                </button>
              )}
            </div>
          </div>
        ))}

        {members.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No team members yet. Invite someone to get started.
          </p>
        )}
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Invite team member"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <Label htmlFor="invEmail">Email</Label>
            <Input
              id="invEmail"
              name="email"
              type="email"
              required
              placeholder="colleague@company.com"
            />
          </div>
          <div>
            <Label htmlFor="invRole">Role</Label>
            <select
              id="invRole"
              name="role"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={pending}>
              Send invite
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
