import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "sample" | "plum" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tone === "neutral" && "bg-rose-soft text-ink",
        tone === "plum" && "bg-plum text-white",
        tone === "sample" && "border border-dashed border-plum bg-white text-plum",
      )}
    >
      {children}
    </span>
  );
}
