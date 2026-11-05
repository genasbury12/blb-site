import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { AdminFooter, AdminNav } from "@/components/admin/admin-nav";
import { DataHandlingNote } from "@/components/admin/data-handling-note";
import { AppShell } from "@/components/shell/app-shell";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin | The BOSS Business System" } };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell
      home="/admin"
      label="Admin Workspace"
      nav={
        <Suspense fallback={<p className="px-3 text-sm text-ink-muted">Loading menu</p>}>
          <AdminNav />
        </Suspense>
      }
      footer={<AdminFooter />}
    >
      {children}
      <Suspense fallback={null}>
        <DataHandlingNote />
      </Suspense>
    </AppShell>
  );
}
