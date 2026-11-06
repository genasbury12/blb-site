import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/admin/action-form";
import { Field, TextArea, TextInput } from "@/components/admin/fields";
import { LessonPicker } from "@/components/admin/worksheet-pickers";
import { PageHeader } from "@/components/shell/page-header";
import { Card } from "@/components/ui/card";
import { requireStaff } from "@/lib/server/staff";
import { loadLessonOptions } from "@/lib/server/worksheets-admin";
import { createWorksheet } from "../actions";

export const metadata: Metadata = { title: "New worksheet" };

export default async function NewWorksheetPage() {
  const { supabase } = await requireStaff(["admin"], "/admin/worksheets/new");
  const modules = await loadLessonOptions(supabase);
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Worksheets"
        title="New worksheet"
        lede="New worksheets start as drafts. Members see a worksheet only when it and its lesson are both published."
        actions={<Link className="text-sm font-semibold text-plum underline underline-offset-4" href="/admin/worksheets">All worksheets</Link>}
      />
      <Card>
        <ActionForm action={createWorksheet} submitLabel="Create draft worksheet">
          <Field label="Title" htmlFor="title">
            <TextInput id="title" name="title" required maxLength={200} placeholder="Lesson 3: Customer Research Workbook" />
          </Field>
          <Field label="Slug" hint="Lowercase letters, numbers and dashes, e.g. m1-l3-customer-research. It cannot change later." htmlFor="slug">
            <TextInput id="slug" name="slug" required />
          </Field>
          <LessonPicker slug={null} currentLessonId={null} modules={modules} label="Attach to lesson" />
          <Field
            label="Questions (optional)"
            hint="Paste the worksheet's schema file (JSON), the same format as the Module 1 worksheets. Leave it empty to create the worksheet now and add the questions later."
            htmlFor="questions"
          >
            <TextArea id="questions" name="questions" className="min-h-40 font-mono text-sm" />
          </Field>
        </ActionForm>
      </Card>
    </div>
  );
}
