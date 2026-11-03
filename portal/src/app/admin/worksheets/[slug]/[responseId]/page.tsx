import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fmtShort } from "@/components/member/time";
import { PageHeader } from "@/components/shell/page-header";
import { WorksheetForm } from "@/components/worksheets/worksheet-form";
import { requireStaff } from "@/lib/server/staff";
import { loadStaffResponse, loadStaffWorksheet } from "@/lib/server/worksheets-admin";

export const metadata: Metadata = { title: "Worksheet answers" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Read only view of one member's worksheet (brief: WorksheetForm in display mode). */
export default async function AdminWorksheetResponsePage({ params }: { params: Promise<{ slug: string; responseId: string }> }) {
  const { slug, responseId } = await params;
  const { supabase } = await requireStaff(["admin", "coach"], `/admin/worksheets/${slug}`);
  if (!UUID.test(responseId)) notFound();
  const response = await loadStaffResponse(supabase, slug, responseId);
  if (!response) notFound();
  const worksheet = await loadStaffWorksheet(supabase, slug, response.version);
  if (!worksheet) notFound();

  return (
    <div className="space-y-8">
      <Link href={`/admin/worksheets/${slug}`} className="text-sm font-semibold text-plum underline-offset-4 hover:underline">
        Back to all answers
      </Link>
      <PageHeader
        eyebrow={worksheet.title}
        title={response.name}
        lede={`${response.status === "complete" && response.completedAt ? `Completed ${fmtShort(response.completedAt)}` : "In progress"}. Last saved ${fmtShort(response.updatedAt)}. Read only.`}
      />
      <div className="rounded-[28px] bg-ivory px-5 py-10 sm:px-10">
        <WorksheetForm
          mode="display"
          slug={slug}
          schema={worksheet.schema}
          initialAnswers={response.answers}
          initialStatus={response.status}
          initialSavedAt={response.updatedAt}
          lessonNumber={worksheet.lessonNumber ?? 0}
          callbacks={{}}
        />
      </div>
    </div>
  );
}
