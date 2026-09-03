import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="h-14 border-b border-border bg-background/60 backdrop-blur px-5 flex items-center justify-between">
      <div>
        <h1 className="text-base font-semibold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
