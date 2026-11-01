import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("block text-sm font-semibold text-ink", className)} {...props} />;
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "mt-1 block min-h-11 w-full rounded-lg border border-mauve bg-white px-3 text-base text-ink placeholder:text-ink-muted aria-[invalid=true]:border-danger",
        className,
      )}
      {...props}
    />
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-sm text-danger" role="alert">
      {message}
    </p>
  );
}
