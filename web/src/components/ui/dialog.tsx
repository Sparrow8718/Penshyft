"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className={cn(
        "rounded-xl border border-border bg-card p-0 shadow-xl backdrop:bg-black/50",
        "w-full max-w-md",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition"
        >
          <X size={14} />
        </button>
      </div>
      <div className="px-5 py-4">{children}</div>
    </dialog>
  );
}
