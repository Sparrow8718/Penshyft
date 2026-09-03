import { cn } from "@/lib/utils";

export function Badge({
  colour,
  children,
  className,
}: {
  colour?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        !colour && "border-border bg-accent text-accent-foreground",
        className,
      )}
      style={
        colour
          ? {
              borderColor: `${colour}30`,
              backgroundColor: `${colour}15`,
              color: colour,
            }
          : undefined
      }
    >
      {colour && (
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: colour }}
        />
      )}
      {children}
    </span>
  );
}
