"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addStaffOnboarding, createShiftOnboarding, completeOnboarding } from "./actions";
import { CheckCircle2, Users, CalendarClock, Rocket } from "lucide-react";

type Step = "welcome" | "staff" | "shift" | "done";

export function OnboardingWizard({ locale }: { locale: string }) {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function handleAddStaff(formData: FormData) {
    startTransition(async () => {
      setMsg(null);
      const result = await addStaffOnboarding(formData);
      if ("error" in result) {
        setMsg(result.error ?? null);
        return;
      }
      setStep("shift");
    });
  }

  function handleCreateShift(formData: FormData) {
    startTransition(async () => {
      setMsg(null);
      const result = await createShiftOnboarding(formData);
      if ("error" in result) {
        setMsg(result.error ?? null);
        return;
      }
      setStep("done");
    });
  }

  function handleComplete() {
    startTransition(async () => {
      await completeOnboarding();
      router.push(`/${locale}/dashboard`);
    });
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {(["welcome", "staff", "shift", "done"] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`h-2 flex-1 max-w-16 rounded-full transition-colors ${
                (["welcome", "staff", "shift", "done"] as Step[]).indexOf(step) >= i
                  ? "bg-primary"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>

        {step === "welcome" && (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Rocket className="text-primary" size={28} />
            </div>
            <h1 className="text-2xl font-bold">{t("welcomeTitle")}</h1>
            <p className="text-muted-foreground">{t("welcomeDescription")}</p>
            <button
              onClick={() => setStep("staff")}
              className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
            >
              {t("getStarted")}
            </button>
          </div>
        )}

        {step === "staff" && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Users className="text-primary" size={22} />
              </div>
              <h2 className="text-xl font-bold">{t("addStaffTitle")}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t("addStaffDescription")}</p>
            </div>
            <form action={handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t("staffName")}</label>
                <input
                  name="name"
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("staffMobile")}</label>
                <input
                  name="mobile"
                  type="tel"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="+44 7700 900000"
                />
              </div>
              {msg && <p className="text-sm text-destructive">{msg}</p>}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("shift")}
                  className="flex-1 rounded-md border border-border py-2 text-sm font-medium hover:bg-muted transition"
                >
                  {t("skip")}
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition"
                >
                  {t("addAndContinue")}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === "shift" && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CalendarClock className="text-primary" size={22} />
              </div>
              <h2 className="text-xl font-bold">{t("createShiftTitle")}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t("createShiftDescription")}</p>
            </div>
            <form action={handleCreateShift} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t("shiftDate")}</label>
                <input
                  name="date"
                  type="date"
                  required
                  defaultValue={defaultDate}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">{t("shiftStart")}</label>
                  <input
                    name="startTime"
                    type="time"
                    required
                    defaultValue="09:00"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t("shiftEnd")}</label>
                  <input
                    name="endTime"
                    type="time"
                    required
                    defaultValue="17:00"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
              {msg && <p className="text-sm text-destructive">{msg}</p>}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("done")}
                  className="flex-1 rounded-md border border-border py-2 text-sm font-medium hover:bg-muted transition"
                >
                  {t("skip")}
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition"
                >
                  {t("createAndContinue")}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === "done" && (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="text-green-500" size={28} />
            </div>
            <h1 className="text-2xl font-bold">{t("doneTitle")}</h1>
            <p className="text-muted-foreground">{t("doneDescription")}</p>
            <button
              onClick={handleComplete}
              disabled={pending}
              className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition"
            >
              {t("goToDashboard")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
