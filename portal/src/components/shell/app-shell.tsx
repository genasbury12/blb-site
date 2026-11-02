import { Menu } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Monogram } from "./monogram";

/**
 * Shared shell for the member portal and admin workspace. Desktop: fixed editorial sidebar.
 * Mobile: top bar with a disclosure menu that works without JavaScript.
 */
export function AppShell({ home, label, nav, footer, children }: { home: string; label: string; nav: ReactNode; footer?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col lg:flex-row">
      <aside className="relative border-b border-rose/70 bg-gradient-to-b from-[#fbf4f1] to-ivory lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-72 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 px-5 py-4 lg:px-7 lg:pt-9">
          <Link href={home} className="flex items-center gap-3 text-plum">
            <Monogram size={38} />
            <span className="leading-tight">
              <span className="block font-display text-[1.2rem] font-semibold text-ink">The BOSS</span>
              <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-mauve-ink">{label}</span>
            </span>
          </Link>
          <details className="group relative lg:hidden">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full border border-rose bg-white px-4 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
              <Menu className="size-4" aria-hidden /> Menu
            </summary>
            <div className="absolute right-0 z-40 mt-2 w-72 rounded-2xl border border-rose bg-white p-3 shadow-[0_18px_40px_-20px_rgba(101,71,79,0.45)]">
              {nav}
              {footer ? <div className="mt-3 border-t border-rose-soft pt-3">{footer}</div> : null}
            </div>
          </details>
        </div>
        <div className="hidden flex-1 flex-col overflow-y-auto px-4 pb-6 pt-6 lg:flex">
          <div className="flex-1">{nav}</div>
          {footer ? <div className="border-t border-rose/70 px-3 pt-5">{footer}</div> : null}
        </div>
      </aside>
      <main id="main" className="min-w-0 flex-1 px-5 pb-20 pt-8 sm:px-8 lg:px-14 lg:pt-14">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
