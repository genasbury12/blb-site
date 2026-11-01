import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, NoAccess } from "@/components/member/access-states";
import { AuditStepper } from "@/components/audit/audit-stepper";
import { Alert } from "@/components/ui/alert";
import type { AnswerKey } from "@/domain/audit/types";
import { AUDIT_V1, SECTION_INTROS } from "@/domain/audit/v1";
import { loadDraft, loadPublishedAuditVersion, loadRuns, PATH_LABELS } from "@/lib/server/audit";
import { getFeatures, requireSession } from "@/lib/server/session";

export const metadata: Metadata = { title: "My Business Audit" };

export default async function AuditPage() {
  const { supabase, user } = await requireSession("/app/audit");
  const features = await getFeatures();
  if (!features.has("audit.use")) return <NoAccess what="The business audit" />;

  const version = await loadPublishedAuditVersion(supabase);
  if (!version) {
    return <Alert tone="info" title="The audit is not available right now">Please check back soon. Your training is still open.</Alert>;
  }
  const [draft, runs] = await Promise.all([loadDraft(supabase, user.id, version.id), loadRuns(supabase, user.id)]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl sm:text-5xl">{runs.length ? "Retake your business audit" : "Your business audit"}</h1>
        <p className="mt-3 max-w-prose text-ink-muted">
          Thirty questions in eight short sections. Answer based on where your business is today. Every answer saves as you go, so you can
          leave and come back. Your training stays open whether or not you finish.
        </p>
        {runs.length ? <p className="mt-2 text-sm text-ink-muted">A retake creates a new report. Your earlier reports and finished lessons stay exactly as they are.</p> : null}
      </header>

      <AuditStepper
        questions={AUDIT_V1.questions}
        sectionIntros={SECTION_INTROS}
        initialAnswers={(draft?.answers_json ?? {}) as Record<string, AnswerKey>}
        initialQuestion={draft?.current_question ?? 1}
      />

      {runs.length ? (
        <section aria-labelledby="history">
          <h2 id="history" className="text-2xl">Earlier reports</h2>
          <ul className="mt-3 space-y-2">
            {runs.map((r) => (
              <li key={r.id}>
                <Link className="font-semibold text-plum underline underline-offset-4" href={`/app/audit/results/${r.id}`}>
                  {formatDate(r.submitted_at)}: {Math.round(r.overall_score)}% overall, {PATH_LABELS[r.assigned_path]}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
