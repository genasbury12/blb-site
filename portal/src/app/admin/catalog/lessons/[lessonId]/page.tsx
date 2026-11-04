import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveSuggestion, setResourceState, suggestEdit, updateLesson, uploadResource } from "@/app/admin/catalog/actions";
import { ActionForm } from "@/components/admin/action-form";
import { Field, StatusPill, TextArea, TextInput } from "@/components/admin/fields";
import { LessonFields, type LessonDefaults } from "@/components/admin/lesson-fields";
import { StatusControls } from "@/components/admin/status-controls";
import { PageHeader, SectionTitle } from "@/components/shell/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ContentStatus } from "@/domain/content";
import { requireStaff } from "@/lib/server/staff";

export const metadata: Metadata = { title: "Edit lesson" };
const UUID = /^[0-9a-f-]{36}$/i;

export default async function EditLessonPage({ params, searchParams }: { params: Promise<{ lessonId: string }>; searchParams: Promise<{ created?: string }> }) {
  const { lessonId } = await params;
  const { created } = await searchParams;
  const { supabase, isAdmin } = await requireStaff(["admin", "coach"], `/admin/catalog/lessons/${lessonId}`);
  if (!UUID.test(lessonId)) notFound();
  const [lesson, modules, resources, suggestions, worksheets] = await Promise.all([
    supabase.from("lessons").select("*").eq("id", lessonId).maybeSingle(),
    supabase.from("modules").select("id, number, title").order("number"),
    supabase.from("lesson_resources").select("id, label, file_name, mime_type, size_bytes, published, checked_at").eq("lesson_id", lessonId).order("created_at"),
    supabase.from("content_suggestions").select("id, body, status, created_at").eq("lesson_id", lessonId).order("created_at", { ascending: false }),
    supabase.from("worksheets").select("slug, version, title, status").eq("lesson_id", lessonId).order("version", { ascending: false }),
  ]);
  if (!lesson.data) notFound();
  const l = lesson.data as LessonDefaults & { id: string; status: ContentStatus; is_sample: boolean; published_at: string | null };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Edit lesson"
        title={l.title}
        actions={<Link className="text-sm font-semibold text-plum underline underline-offset-4" href="/admin/catalog">All modules</Link>}
      />
      {created ? <Alert tone="success">Draft created.</Alert> : null}
      {l.is_sample ? <Alert tone="warning" title="Sample content">This is SAMPLE content for testing. It can never be published in production.</Alert> : null}

      <Card>
        <StatusControls id={l.id} table="lessons" status={l.status} canEdit={isAdmin} />
        <p className="mt-3 text-sm text-ink-muted">
          Publishing checks that video lessons have captions and a transcript. {l.published_at ? `First published ${new Date(l.published_at).toLocaleDateString("en-US")}.` : ""}
        </p>
      </Card>

      {isAdmin ? (
        <Card>
          <ActionForm action={updateLesson} submitLabel="Save lesson">
            <input type="hidden" name="id" value={l.id} />
            <LessonFields d={l} modules={(modules.data ?? []) as { id: string; number: number; title: string }[]} />
          </ActionForm>
        </Card>
      ) : null}

      <section aria-labelledby="worksheet">
        <SectionTitle id="worksheet">Worksheet</SectionTitle>
        <Card>
          {(worksheets.data ?? []).length ? (
            <ul className="space-y-2">
              {(worksheets.data ?? []).map((w) => (
                <li key={`${w.slug}-${w.version}`} className="flex flex-wrap items-center gap-3">
                  <Link className="font-semibold text-plum underline underline-offset-4" href={`/admin/worksheets/${w.slug}`}>{w.title as string}</Link>
                  <Badge>Version {w.version as number}</Badge>
                  <StatusPill status={w.status as ContentStatus} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">No worksheet on this lesson.</p>
          )}
          <p className="mt-3 text-sm text-ink-muted">Publish or archive a worksheet from its page. Members see it only when both the worksheet and this lesson are published.</p>
        </Card>
      </section>

      <section aria-labelledby="resources">
        <SectionTitle id="resources">Downloads</SectionTitle>
        <Card className="space-y-5">
          {(resources.data ?? []).length ? (
            <ul className="divide-y divide-rose-soft">
              {(resources.data ?? []).map((r) => (
                <li key={r.id as string} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="font-medium">{r.label as string}</span>
                  <span className="text-sm text-ink-muted">{r.file_name as string} ({Math.round(((r.size_bytes as number) ?? 0) / 1024)} KB)</span>
                  {r.published ? <Badge tone="plum">Published</Badge> : <Badge>Not published</Badge>}
                  <a className="text-sm font-semibold text-plum underline" href={`/api/files/lesson-resource/${r.id}?preview=1`}>
                    Open to check
                  </a>
                  {isAdmin ? (
                    <div className="ml-auto flex gap-2">
                      <ActionForm action={setResourceState} submitLabel={r.published ? "Unpublish" : "Checked, publish"} variant="secondary" className="flex">
                        <input type="hidden" name="id" value={r.id as string} />
                        <input type="hidden" name="lesson_id" value={l.id} />
                        <input type="hidden" name="action" value={r.published ? "unpublish" : "publish"} />
                      </ActionForm>
                      <ActionForm action={setResourceState} submitLabel="Delete" variant="quiet" className="flex">
                        <input type="hidden" name="id" value={r.id as string} />
                        <input type="hidden" name="lesson_id" value={l.id} />
                        <input type="hidden" name="action" value="delete" />
                      </ActionForm>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">No downloads yet.</p>
          )}
          {isAdmin ? (
            <ActionForm action={uploadResource} submitLabel="Upload" encType="multipart/form-data" className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <input type="hidden" name="lesson_id" value={l.id} />
              <Field label="Label members see" htmlFor="label">
                <TextInput id="label" name="label" required maxLength={140} />
              </Field>
              <Field label="File (PDF, Word, Excel or text, up to 25 MB)" htmlFor="file">
                <TextInput id="file" name="file" type="file" required accept=".pdf,.docx,.xlsx,.txt" className="py-2" />
              </Field>
            </ActionForm>
          ) : null}
        </Card>
      </section>

      <section aria-labelledby="suggestions">
        <SectionTitle id="suggestions">Edit suggestions</SectionTitle>
        <Card className="space-y-5">
          {(suggestions.data ?? []).map((sg) => (
            <div key={sg.id as string} className="rounded-xl bg-rose-soft/50 p-4">
              <p className="whitespace-pre-line text-sm">{sg.body as string}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
                <span className="capitalize">{sg.status as string}</span>
                {isAdmin && sg.status === "open"
                  ? (["accepted", "declined"] as const).map((s) => (
                      <ActionForm key={s} action={resolveSuggestion} submitLabel={s === "accepted" ? "Mark accepted" : "Decline"} variant="quiet" className="flex">
                        <input type="hidden" name="id" value={sg.id as string} />
                        <input type="hidden" name="lesson_id" value={l.id} />
                        <input type="hidden" name="status" value={s} />
                      </ActionForm>
                    ))
                  : null}
              </div>
            </div>
          ))}
          <ActionForm action={suggestEdit} submitLabel="Send suggestion" variant="secondary">
            <input type="hidden" name="lesson_id" value={l.id} />
            <Field label="Suggest an edit" hint="Coaches suggest; only an admin can change or publish the lesson." htmlFor="body">
              <TextArea id="body" name="body" required maxLength={4000} />
            </Field>
          </ActionForm>
        </Card>
      </section>
    </div>
  );
}
