import type { ReactNode } from "react";
import { Suspense } from "react";
import { MemberNav } from "@/components/member/member-nav";
import { Wordmark } from "@/components/wordmark";

export default function MemberLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:gap-10">
      <aside className="lg:w-60 lg:shrink-0">
        <div className="mb-4">
          <Wordmark href="/app" />
        </div>
        <Suspense fallback={<p className="text-sm text-ink-muted">Loading menu</p>}>
          <MemberNav />
        </Suspense>
      </aside>
      <main id="main" className="min-w-0 flex-1 pb-16">
        {children}
      </main>
    </div>
  );
}
