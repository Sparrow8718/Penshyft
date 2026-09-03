"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { INDUSTRY_KEYS } from "@/lib/onboarding/industry-presets";
import { updateOrg } from "./actions";

export function OrgSettingsForm({
  orgId,
  orgName,
  industry,
  areaLabel,
}: {
  orgId: string;
  orgName: string;
  industry: string;
  areaLabel: string;
}) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const ta = useTranslations("auth");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const fd = new FormData(e.currentTarget);
    fd.set("orgId", orgId);
    startTransition(async () => {
      const result = await updateOrg(fd);
      if (result?.error) setError(result.error);
      else setSaved(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-sm">
      <div>
        <Label htmlFor="name">{t("org")}</Label>
        <Input id="name" name="name" defaultValue={orgName} required />
      </div>
      <div>
        <Label htmlFor="industry">{ta("industry")}</Label>
        <Select id="industry" name="industry" defaultValue={industry}>
          {INDUSTRY_KEYS.map((key) => (
            <option key={key} value={key}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="areaLabel">{t("areas")}</Label>
        <Input id="areaLabel" name="areaLabel" defaultValue={areaLabel} required />
        <p className="mt-1 text-xs text-muted-foreground">
          What you call areas (e.g. Ward, Room, Section, Department)
        </p>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {saved && <p className="text-sm text-success">Saved</p>}

      <Button type="submit" disabled={pending}>
        {pending ? tc("save") + "…" : tc("save")}
      </Button>
    </form>
  );
}
