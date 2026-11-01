import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const tones = {
  info: "border-mauve bg-white text-ink",
  warning: "border-plum bg-rose-soft text-ink",
  danger: "border-danger bg-white text-danger",
  success: "border-success bg-white text-success",
} as const;

export function Alert({ tone = "info", title, children, className }: { tone?: keyof typeof tones; title?: string; children?: ReactNode; className?: string }) {
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("rounded-xl border-l-4 border p-4", tones[tone], className)}>
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? <div className="mt-1 text-sm leading-relaxed">{children}</div> : null}
    </div>
  );
}
