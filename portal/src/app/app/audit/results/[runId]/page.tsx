import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuditReport } from "@/components/audit/audit-report";
import { PathChooser } from "@/components/audit/path-chooser";
import { ButtonLink } from "@/components/ui/button";
import { loadCurrentPath, loadRun } from "@/lib/server/audit";
import { loadCatalog } from "@/lib/server/learning";
import { requireSession } from "@/lib/server/session";

export const metadata: Metadata = { title: "Audit report" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ResultsPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const { supabase } = await requireSession(`/app/audit/results/${runId}`);
  if (!UUID.test(runId)) notFound();
  // RLS returns only the member's own runs (or an assigned coach's), so another member's id is simply not found.
  const run = await loadRun(supabase, runId);
  if (!run) notFound();
  const [catalog, currentPath] = await Promise.all([loadCatalog(supabase), loadCurrentPath(supabase)]);
  const slugs = new Map(catalog.modules.map((m) => [m.id, m.slug]));
  const lessonHref = (lessonId: string | null) => {
    const l = lessonId ? catalog.lessons.find((x) => x.id === lessonId) : undefined;
    return l ? `/app/training/${slugs.get(l.module_id)}/${l.slug}` : null;
  };
  const effectivePath = currentPath ?? run.assigned_path;

  return (
    <AuditReport
      run={run}
      effectivePath={effectivePath}
      lessonHref={lessonHref}
      pathChooser={<PathChooser runId={run.id} current={effectivePath} />}
      actions={
        <>
          <ButtonLink href="/app">Back to my dashboard</ButtonLink>
          <a href={`/app/audit/results/${run.id}/pdf`} className="inline-flex min-h-11 items-center justify-center rounded-full border border-mauve bg-white px-6 text-[0.95rem] font-semibold text-ink hover:bg-rose-soft">
            Download PDF report
          </a>
          <ButtonLink href="/app/audit" variant="secondary">
            Retake the audit
          </ButtonLink>
        </>
      }
    />
  );
}
