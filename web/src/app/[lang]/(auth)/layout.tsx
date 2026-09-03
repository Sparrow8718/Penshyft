import { Sparkles } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles size={20} />
          </div>
          <h1 className="text-xl font-semibold">Penshyft</h1>
        </div>
        {children}
      </div>
    </div>
  );
}
