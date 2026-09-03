import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:opacity-90",
  secondary:
    "border border-border bg-card text-foreground hover:bg-accent",
  danger:
    "bg-danger text-white hover:opacity-90",
  ghost:
    "text-muted-foreground hover:text-foreground hover:bg-accent",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
