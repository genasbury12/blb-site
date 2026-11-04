import { cn } from "@/lib/cn";

/** The worksheet rating as a small pill, matching the form's Strong / Uncertain / Weak styles. */
const STYLE: Record<string, string> = {
  strong: "border-plum bg-plum text-white",
  uncertain: "border-rose bg-rose text-ink",
  weak: "border-mauve bg-white italic text-mauve-ink",
};

export function RatingPill({ rating, label }: { rating: string | null; label: string }) {
  if (!rating) return <span className="text-ink-muted">Not rated</span>;
  return <span className={cn("inline-flex items-center rounded-full border-[1.5px] px-2.5 py-0.5 text-xs font-semibold", STYLE[rating] ?? STYLE.strong)}>{label || rating}</span>;
}
