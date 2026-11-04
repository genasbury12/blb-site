import { Download } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { MemberWorksheetModule, MemberWorksheetStatus } from "@/lib/server/worksheets";

const STATUS: Record<MemberWorksheetStatus, { label: string; tone: "neutral" | "plum" }> = {
  not_started: { label: "Not started", tone: "neutral" },
  in_progress: { label: "In progress", tone: "neutral" },
  complete: { label: "Complete", tone: "plum" },
};

/** Library "Your worksheets" (owner addition to Slice D): same card list styling as the Library items. */
export function YourWorksheets({ modules }: { modules: MemberWorksheetModule[] }) {
  if (!modules.length) return null;
  return (
    <section aria-labelledby="your-worksheets" className="mb-12">
      <h2 id="your-worksheets" className="font-display text-3xl">Your worksheets</h2>
      <p className="mt-1 text-sm text-ink-muted">Your answers from each lesson, saved as you go. Download a PDF once a worksheet is complete.</p>
      {modules.map((m) => (
        <div key={m.moduleSlug} className="mt-6" data-testid={`ws-module-${m.moduleNumber}`}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-xl">
              Module {m.moduleNumber}: {m.moduleTitle}
            </h3>
            {m.anyComplete ? (
              <a href={`/api/worksheets/module/${m.moduleSlug}/pdf`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                <Download className="size-4" aria-hidden />
                Download all Module {m.moduleNumber} worksheets
                <span className="sr-only"> (PDF)</span>
              </a>
            ) : (
              <p className="text-sm text-ink-muted">Complete a worksheet to download them all as one PDF.</p>
            )}
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {m.items.map((w) => (
              <li key={w.slug} data-testid={`ws-item-${w.slug}`} className="h-full rounded-[22px] border border-rose/70 bg-white p-6">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-mauve-ink">
                  Module {m.moduleNumber} · Lesson {w.lessonNumber}
                </p>
                <p className="mt-2 font-display text-xl leading-snug">
                  <Link href={w.href} className="hover:text-plum hover:underline">
                    {w.title}
                  </Link>
                </p>
                <p className="mt-1 text-sm text-ink-muted">{w.lessonTitle}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Badge tone={STATUS[w.status].tone}>{STATUS[w.status].label}</Badge>
                  {w.status === "complete" ? (
                    <a href={`/api/worksheets/${w.slug}/pdf`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-plum underline-offset-4 hover:underline">
                      <Download className="size-4" aria-hidden />
                      Download PDF
                      <span className="sr-only"> of {w.title}</span>
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
