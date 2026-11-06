import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DataTable } from "@/components/admin/fields";
import { ActionForm } from "@/components/admin/action-form";
import { TextArea } from "@/components/admin/fields";
import { StatusControls } from "@/components/admin/status-controls";
import { LessonPicker } from "@/components/admin/worksheet-pickers";
import { Alert } from "@/components/ui/alert";
import { fmtShort } from "@/components/member/time";
import { PageHeader } from "@/components/shell/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, Stat } from "@/components/ui/card";
import { RatingPill } from "@/components/worksheets/rating-pill";
import type { ContentStatus } from "@/domain/content";
import { adminCell, adminColumns, adminCounts, weakCounts } from "@/domain/worksheets/admin";
import { cn } from "@/lib/cn";
import { requireStaff } from "@/lib/server/staff";
import { concreteFields } from "@/domain/worksheets/schema";
import { loadLessonOptions, loadStaffResponses, loadStaffWorksheet, type ResponseFilter } from "@/lib/server/worksheets-admin";
import { replaceWorksheetQuestions, setWorksheetLesson } from "../actions";

export const metadata: Metadata = { title: "Worksheet answers" };

const FILTERS: { value: ResponseFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in_progress", label: "In progress" },
  { value: "complete", label: "Complete" },
];

export default async function AdminWorksheetPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ status?: string; created?: string }> }) {
  const { slug } = await params;
  const { supabase, isAdmin } = await requireStaff(["admin", "coach"], `/admin/worksheets/${slug}`);
  const sp = await searchParams;
  const filter: ResponseFilter = FILTERS.some((f) => f.value === sp.status) ? (sp.status as ResponseFilter) : "all";

  const worksheet = await loadStaffWorksheet(supabase, slug);
  if (!worksheet) notFound();
  const modules = isAdmin ? await loadLessonOptions(supabase) : [];
  const questionCount = concreteFields(worksheet.schema).length;
  const hasQuestions = questionCount > 0 || Boolean(worksheet.schema.callbacks?.length) || worksheet.schema.sections.some((x) => x.callback || x.callbacks_inline?.length);
  // Counts always cover every response the caller may read; the table follows the filter.
  const all = await loadStaffResponses(supabase, slug, { isAdmin });
  const rows = filter === "all" ? all : all.filter((r) => r.status === filter);
  const columns = adminColumns(worksheet.schema);
  const weak = weakCounts(worksheet.schema, all);
  const counts = adminCounts(worksheet.schema, all);
  const head = ["Member", ...(isAdmin ? ["Email"] : []), "Status", "Completed", ...columns.map((c) => c.header)];

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow={worksheet.lessonLabel ?? "Worksheet, not attached to a lesson"}
        title={worksheet.title}
        lede={isAdmin ? "Every member's answers. Open a row to read the whole worksheet." : "Answers from members assigned to you. Read only."}
        actions={
          isAdmin ? (
            <a href={`/api/admin/worksheets/${slug}/csv`} className={buttonVariants({ variant: "secondary" })}>
              Export CSV
            </a>
          ) : null
        }
      />

      {sp.created ? <Alert tone="success">Worksheet created as a draft.</Alert> : null}

      {isAdmin ? (
        <Card>
          <ActionForm action={setWorksheetLesson} submitLabel="Save lesson">
            <input type="hidden" name="slug" value={worksheet.slug} />
            <LessonPicker slug={worksheet.slug} currentLessonId={worksheet.lessonId} modules={modules} />
          </ActionForm>
        </Card>
      ) : (
        <Card tone="quiet">
          <p className="text-sm">{worksheet.lessonLabel ? `Attached to ${worksheet.lessonLabel}.` : "Not attached to a lesson."}</p>
        </Card>
      )}

      {isAdmin ? (
        <Card tone="quiet">
          <h2 className="font-display text-xl">Questions</h2>
          {hasQuestions ? (
            <p className="mt-1 text-sm text-ink-muted">{questionCount} {questionCount === 1 ? "question" : "questions"}. They come from the worksheet&apos;s schema file.</p>
          ) : (
            <p className="mt-1 text-sm text-ink" data-testid="no-questions">
              This worksheet has no questions yet, so it cannot be published. Questions are written as a schema file (JSON); the admin cannot build them field by field yet.
            </p>
          )}
          {worksheet.status === "draft" ? (
            <ActionForm action={replaceWorksheetQuestions} submitLabel={hasQuestions ? "Replace questions" : "Load questions"} variant="secondary">
              <input type="hidden" name="id" value={worksheet.id} />
              <label htmlFor="questions" className="mt-3 block text-sm font-semibold">
                Paste a schema file
              </label>
              <TextArea id="questions" name="questions" className="min-h-40 font-mono text-sm" placeholder='{ "title": "...", "intro": { ... }, "sections": [ ... ] }' />
            </ActionForm>
          ) : (
            <p className="mt-2 text-sm text-ink-muted">Move it back to draft to replace its questions.</p>
          )}
        </Card>
      ) : null}

      <Card tone="quiet">
        <StatusControls id={worksheet.id} table="worksheets" status={worksheet.status as ContentStatus} canEdit={isAdmin} />
        <p className="mt-2 text-sm text-ink-muted">Members see a worksheet only when it is published and its lesson is open to them.</p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><Stat label="Started" value={String(all.length)} /></Card>
        <Card><Stat label="Completed" value={String(all.filter((r) => r.status === "complete").length)} /></Card>
        {weak.map((w) => (
          <Card key={w.header}><Stat label={`Weak: ${w.header}`} value={String(w.weak)} /></Card>
        ))}
        {counts.map((c) => (
          <Card key={c.label} data-testid="ws-admin-count"><Stat label={c.label} value={c.value} hint={c.hint} /></Card>
        ))}
      </div>

      <section aria-labelledby="responses" className="space-y-4">
        <h2 id="responses" className="font-display text-2xl">Responses</h2>
        <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={f.value === "all" ? `/admin/worksheets/${slug}` : `/admin/worksheets/${slug}?status=${f.value}`}
              aria-current={f.value === filter ? "page" : undefined}
              className={cn(buttonVariants({ variant: "secondary", size: "sm" }), f.value === filter && "border-plum bg-plum text-white hover:bg-plum")}
            >
              {f.label}
            </Link>
          ))}
        </nav>
        {rows.length === 0 ? (
          <Card tone="quiet">
            <p className="text-ink-muted">{all.length === 0 ? "No member has started this worksheet yet." : "No responses match this filter."}</p>
          </Card>
        ) : (
          <DataTable caption={`Responses to ${worksheet.title}`} head={head}>
            {rows.map((r) => (
              <tr key={r.id} data-testid="ws-response-row">
                <td className="px-4 py-3">
                  <Link className="font-medium text-plum underline-offset-4 hover:underline" href={`/admin/worksheets/${slug}/${r.id}`}>
                    {r.name}
                  </Link>
                </td>
                {isAdmin ? <td className="px-4 py-3">{r.email ?? ""}</td> : null}
                <td className="px-4 py-3 whitespace-nowrap">{r.status === "complete" ? "Complete" : "In progress"}</td>
                <td className="px-4 py-3 whitespace-nowrap">{r.completedAt ? fmtShort(r.completedAt) : ""}</td>
                {columns.map((c) => {
                  const cell = adminCell(worksheet.schema, c.spec, r.answers);
                  return (
                    <td key={c.spec} className="min-w-52 max-w-xs px-4 py-3 align-top">
                      {cell.kind === "rating" ? (
                        <div className="space-y-1">
                          <RatingPill rating={cell.rating} label={cell.label} />
                          {cell.note ? <p className="line-clamp-3 text-ink-muted">{cell.note}</p> : null}
                        </div>
                      ) : (
                        <p className="line-clamp-4">{cell.text}</p>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </DataTable>
        )}
      </section>
    </div>
  );
}
