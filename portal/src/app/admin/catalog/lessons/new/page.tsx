import type { Metadata } from "next";
import { createLesson } from "@/app/admin/catalog/actions";
import { ActionForm } from "@/components/admin/action-form";
import { LessonFields } from "@/components/admin/lesson-fields";
import { PageHeader } from "@/components/shell/page-header";
import { Card } from "@/components/ui/card";
import { requireStaff } from "@/lib/server/staff";

export const metadata: Metadata = { title: "New lesson" };

export default async function NewLessonPage({ searchParams }: { searchParams: Promise<{ module?: string }> }) {
  const { supabase } = await requireStaff(["admin"], "/admin/catalog/lessons/new");
  const { module } = await searchParams;
  const { data: modules } = await supabase.from("modules").select("id, number, title").order("number");
  const list = (modules ?? []) as { id: string; number: number; title: string }[];
  return (
    <div>
      <PageHeader eyebrow="Curriculum" title="New lesson" lede="New lessons start as drafts. Members never see drafts." />
      <Card>
        <ActionForm action={createLesson} submitLabel="Create draft lesson">
          <LessonFields d={{ module_id: module && list.some((m) => m.id === module) ? module : list[0]?.id ?? "" }} modules={list} />
        </ActionForm>
      </Card>
    </div>
  );
}
