import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("rounded-[var(--radius-card)] border border-rose bg-white p-6 shadow-[0_1px_0_rgba(101,71,79,0.06)]", className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentProps<"h2">) {
  return <h2 className={cn("font-display text-2xl text-ink", className)} {...props} />;
}

export function Eyebrow({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted", className)} {...props} />;
}
