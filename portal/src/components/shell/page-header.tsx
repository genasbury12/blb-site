import type { ReactNode } from "react";

/** Editorial page header: eyebrow, serif title, ornamental rule, optional lede and actions. */
export function PageHeader({ eyebrow, title, lede, actions }: { eyebrow?: string; title: ReactNode; lede?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-10">
      {eyebrow ? <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-mauve-ink">{eyebrow}</p> : null}
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-[2.6rem] font-medium leading-[1.05] tracking-tight text-ink sm:text-[3.4rem]">{title}</h1>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
      <Ornament className="mt-5" />
      {lede ? <p className="mt-5 max-w-2xl text-[1.05rem] leading-relaxed text-ink-muted">{lede}</p> : null}
    </header>
  );
}

export function Ornament({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 text-rose-deep ${className}`} aria-hidden="true">
      <span className="h-px w-16 bg-current" />
      <svg width="8" height="8" viewBox="0 0 8 8"><path d="M4 0 8 4 4 8 0 4Z" fill="currentColor" /></svg>
      <span className="h-px flex-1 bg-gradient-to-r from-current to-transparent" />
    </div>
  );
}

export function SectionTitle({ id, children, aside }: { id?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4">
      <h2 id={id} className="font-display text-[1.75rem] font-medium text-ink">{children}</h2>
      {aside}
    </div>
  );
}
