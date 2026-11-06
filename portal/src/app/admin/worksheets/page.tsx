import type { Metadata } from "next";
import Link from "next/link";
import { DataTable } from "@/components/admin/fields";
import { PageHeader } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireStaff } from "@/lib/server/staff";
import { listStaffWorksheets } from "@/lib/server/worksheets-admin";

export const metadata: Metadata = { title: "Worksheets" };

const STATUS_LABEL: Record<string, string> = { draft: "Draft", review: "In review", approved: "Approved", published: "Published", archived: "Archived" };

export default async function AdminWorksheetsPage() {
  const { supabase, isAdmin } = await requireStaff(["admin", "coach"], "/admin/worksheets");
  const worksheets = await listStaffWorksheets(supabase);

  return (
    <div>
      <PageHeader
        eyebrow="Worksheets"
        title="Worksheet answers"
        lede={isAdmin ? "How many members started and finished each worksheet. Open one to read answers, export them, or move it to another lesson." : "Answers from members assigned to you. Read only."}
        actions={isAdmin ? <ButtonLink href="/admin/worksheets/new">New worksheet</ButtonLink> : null}
      />
      {worksheets.length === 0 ? (
        <Card tone="quiet">
          <p className="font-display text-xl">No worksheets yet</p>
          <p className="mt-1 text-sm text-ink-muted">Worksheets appear here once they are added to a lesson.</p>
        </Card>
      ) : (
        <DataTable caption="Worksheets" head={["Worksheet", "Lesson", "Status", "Started", "Complete"]}>
          {worksheets.map((w) => (
            <tr key={w.slug}>
              <td className="px-4 py-3">
                <Link className="font-medium hover:text-plum hover:underline" href={`/admin/worksheets/${w.slug}`}>
                  {w.title}
                </Link>
              </td>
              <td className="px-4 py-3">{w.lessonLabel ?? "Not attached"}</td>
              <td className="px-4 py-3">
                <Badge tone={w.status === "published" ? "plum" : "neutral"}>{STATUS_LABEL[w.status] ?? w.status}</Badge>
              </td>
              <td className="px-4 py-3" data-testid={`started-${w.slug}`}>{w.started}</td>
              <td className="px-4 py-3" data-testid={`complete-${w.slug}`}>{w.complete}</td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
