"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateName, updateEmail, changePassword } from "./actions";

export function ProfileForm({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: string;
}) {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const [nameMsg, setNameMsg] = useState<string | null>(null);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleName(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNameMsg(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateName(fd);
      setNameMsg(res.error ?? t("nameUpdated"));
    });
  }

  function handleEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailMsg(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateEmail(fd);
      setEmailMsg(res.error ?? t("emailUpdated"));
    });
  }

  function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwMsg(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await changePassword(fd);
      if (res.error) setPwMsg(res.error);
      else {
        setPwMsg(t("passwordUpdated"));
        e.currentTarget?.reset();
      }
    });
  }

  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <h2 className="text-sm font-semibold mb-1">{t("role")}</h2>
        <p className="text-sm text-muted-foreground capitalize">{role.replace("_", " ")}</p>
      </div>

      <form onSubmit={handleName} className="space-y-3">
        <h2 className="text-sm font-semibold">{t("name")}</h2>
        <div>
          <Label htmlFor="profileName">{t("name")}</Label>
          <Input id="profileName" name="name" defaultValue={name} required />
        </div>
        {nameMsg && (
          <p className={`text-xs ${nameMsg.includes("Updated") || nameMsg.includes("atualizado") || nameMsg.includes("mis à jour") || nameMsg.includes("actualizado") ? "text-emerald-600" : "text-danger"}`}>
            {nameMsg}
          </p>
        )}
        <Button type="submit" disabled={pending} className="h-8 text-xs">
          {tc("save")}
        </Button>
      </form>

      <form onSubmit={handleEmail} className="space-y-3">
        <h2 className="text-sm font-semibold">{t("email")}</h2>
        <div>
          <Label htmlFor="profileEmail">{t("email")}</Label>
          <Input id="profileEmail" name="email" type="email" defaultValue={email} required />
        </div>
        {emailMsg && (
          <p className={`text-xs ${emailMsg.includes("check") || emailMsg.includes("vérifié") || emailMsg.includes("verific") ? "text-emerald-600" : "text-danger"}`}>
            {emailMsg}
          </p>
        )}
        <Button type="submit" disabled={pending} className="h-8 text-xs">
          {tc("save")}
        </Button>
      </form>

      <form onSubmit={handlePassword} className="space-y-3">
        <h2 className="text-sm font-semibold">{t("changePassword")}</h2>
        <div>
          <Label htmlFor="newPw">{t("newPassword")}</Label>
          <Input id="newPw" name="password" type="password" minLength={6} required />
        </div>
        <div>
          <Label htmlFor="confirmPw">{t("confirmPassword")}</Label>
          <Input id="confirmPw" name="confirm" type="password" minLength={6} required />
        </div>
        {pwMsg && (
          <p className={`text-xs ${pwMsg.includes("updated") || pwMsg.includes("atualizada") || pwMsg.includes("mis à jour") || pwMsg.includes("actualizada") ? "text-emerald-600" : "text-danger"}`}>
            {pwMsg}
          </p>
        )}
        <Button type="submit" disabled={pending} className="h-8 text-xs">
          {t("changePassword")}
        </Button>
      </form>
    </div>
  );
}
