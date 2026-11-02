import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createMilestone, updateModule } from "@/app/admin/catalog/actions";
import { ActionForm } from "@/components/admin/action-form";
import { Field, TextArea, TextInput } from "@/components/admin/fields";
import { StatusControls } from "@/components/admin/status-controls";
import { PageHeader, SectionTitle } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ContentStatus } from "@/domain/content";
import { requireStaff } from "@/lib/server/staff";

export const metadata: Metadata = { title: "Module settings" };

export default async function ModulePage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params;
  const { supabase, isAdmin } = await requireStaff(["admin", "coach"], `/admin/catalog/modules/${moduleId}`);
  if (!/^[0-9a-f-]{36}$/i.test(moduleId)) notFound();
  const [mod, milestones] = await Promise.all([
    supabase.from("modules").select("id, number, title, outcome, status").eq("id", moduleId).maybeSingle(),
    supabase.from("milestones").select("id, title, slug, order_index, status, is_sample").eq("module_id", moduleId).order("order_index"),
  ]);
  if (!mod.data) notFound();
  const m = mod.data as { id: string; number: number; title: string; outcome: string; status: ContentStatus };
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`Module ${m.number}`}
        title={m.title}
        actions={
          <>
            {isAdmin ? <ButtonLink href={`/admin/catalog/lessons/new?module=${m.id}`}>Add lesson</ButtonLink> : null}
            <Link className="self-center text-sm font-semibold text-plum underline underline-offset-4" href="/admin/catalog">All modules</Link>
          </>
        }
      />
      <Card>
        <StatusControls id={m.id} table="modules" status={m.status} canEdit={isAdmin} />
        <p className="mt-3 text-sm text-ink-muted">A module must be published for any of its lessons to appear to members.</p>
      </Card>
      {isAdmin ? (
        <Card>
          <ActionForm action={updateModule} submitLabel="Save module">
            <input type="hidden" name="id" value={m.id} />
            <Field label="Title" htmlFor="title">
              <TextInput id="title" name="title" required defaultValue={m.title} />
            </Field>
            <Field label="Outcome" htmlFor="outcome">
              <TextArea id="outcome" name="outcome" required defaultValue={m.outcome} />
            </Field>
          </ActionForm>
        </Card>
      ) : null}
      <section aria-labelledby="milestones">
        <SectionTitle id="milestones">Business milestones</SectionTitle>
        <Card className="space-y-5">
          <ul className="divide-y divide-rose-soft">
            {(milestones.data ?? []).map((ms) => (
              <li key={ms.id as string} className="flex flex-wrap items-center gap-3 py-3">
                <span className="font-medium">{ms.title as string}</span>
                {ms.is_sample ? <Badge tone="sample">Sample</Badge> : null}
                <div className="ml-auto">
                  <StatusControls id={ms.id as string} table="milestones" status={ms.status as ContentStatus} canEdit={isAdmin} />
                </div>
              </li>
            ))}
          </ul>
          {isAdmin ? (
            <ActionForm action={createMilestone} submitLabel="Add milestone" variant="secondary" className="grid gap-4 sm:grid-cols-[2fr_1fr_100px_auto] sm:items-end">
              <input type="hidden" name="module_id" value={m.id} />
              <Field label="Milestone" htmlFor="ms-title">
                <TextInput id="ms-title" name="title" required />
              </Field>
              <Field label="Slug" htmlFor="ms-slug">
                <TextInput id="ms-slug" name="slug" required pattern="[a-z0-9-]{3,80}" />
              </Field>
              <Field label="Order" htmlFor="ms-order">
                <TextInput id="ms-order" name="order_index" type="number" min={1} max={99} defaultValue={(milestones.data?.length ?? 0) + 1} />
              </Field>
            </ActionForm>
          ) : null}
        </Card>
      </section>
    </div>
  );
}
