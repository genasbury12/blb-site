import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, tone = "plain", ...props }: ComponentProps<"section"> & { tone?: "plain" | "feature" | "quiet" }) {
  return (
    <section
      className={cn(
        "rounded-[22px] border p-6 sm:p-7",
        tone === "plain" && "border-rose/70 bg-white shadow-[0_1px_0_rgba(101,71,79,0.04),0_18px_40px_-32px_rgba(101,71,79,0.45)]",
        tone === "feature" && "border-plum/25 bg-gradient-to-br from-white via-white to-rose-soft shadow-[0_24px_60px_-40px_rgba(101,71,79,0.7)]",
        tone === "quiet" && "border-rose/60 bg-white/60",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: ComponentProps<"h2">) {
  return <h2 className={cn("font-display text-[1.6rem] font-medium leading-tight text-ink", className)} {...props} />;
}

export function Eyebrow({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-mauve-ink", className)} {...props} />;
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-mauve-ink">{label}</p>
      <p className="numeral mt-1 text-[2.6rem] leading-none text-ink">{value}</p>
      {hint ? <p className="mt-1 text-sm text-ink-muted">{hint}</p> : null}
    </div>
  );
}
