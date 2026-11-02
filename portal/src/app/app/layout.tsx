import type { ReactNode } from "react";
import { Suspense } from "react";
import { MemberFooter, MemberNav } from "@/components/member/member-nav";
import { AppShell } from "@/components/shell/app-shell";

export default function MemberLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell
      home="/app"
      label="Business System"
      nav={
        <Suspense fallback={<p className="px-3 text-sm text-ink-muted">Loading menu</p>}>
          <MemberNav />
        </Suspense>
      }
      footer={
        <Suspense fallback={null}>
          <MemberFooter />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  );
}
