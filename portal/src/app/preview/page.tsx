import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuditReport, type ReportRun } from "@/components/audit/audit-report";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle, Eyebrow } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { Wordmark } from "@/components/wordmark";
import { scoreAudit } from "@/domain/audit/score";
import type { AnswerKey, CatalogLesson } from "@/domain/audit/types";
import { AUDIT_V1 } from "@/domain/audit/v1";
import { appEnv } from "@/lib/env";
import { PreviewStepper } from "./preview-stepper";

export const metadata: Metadata = { title: "Design preview", robots: { index: false } };

/**
 * Design preview for owner review and screenshots, rendered from fixture data only.
 * It reads and writes nothing and is not available in staging or production.
 */
const FIXTURE_ANSWERS: Record<string, AnswerKey> = Object.fromEntries(
  AUDIT_V1.questions.map((q) => [q.code, (["B", "C", "B", "A", "C", "B", "B", "C", "B", "A"] as AnswerKey[])[q.number % 10]!]),
);

const FIXTURE_CATALOG: CatalogLesson[] = [
  ...Array.from({ length: 7 }, (_, i) => ({ id: `m1-l${i + 1}`, moduleNumber: 1, orderIndex: i + 1, title: `SAMPLE: Module 1 lesson ${i + 1}`, essential: true, status: "published" as const })),
  ...Array.from({ length: 7 }, (_, i) => ({ id: `m${i + 2}-l1`, moduleNumber: i + 2, orderIndex: 1, title: `SAMPLE: Module ${i + 2} lesson 1`, essential: true, status: "published" as const })),
];

export default function PreviewPage() {
  if (appEnv() === "production" || appEnv() === "staging") notFound();
  const result = scoreAudit(AUDIT_V1, FIXTURE_ANSWERS, FIXTURE_CATALOG);
  const { categoryScores, ...rec } = result;
  const run: ReportRun = {
    id: "preview",
    submitted_at: "2027-02-15T17:00:00Z",
    overall_score: result.overallScore.percent,
    scoring_version: result.scoringVersion,
    category_scores_json: categoryScores,
    recommendation_snapshot_json: rec,
  };
  const partial = Object.fromEntries(Object.entries(FIXTURE_ANSWERS).slice(0, 6));

  return (
    <div className="mx-auto w-full max-w-5xl space-y-12 px-4 py-8 sm:px-6">
      <Wordmark />
      <Alert tone="warning" title="Design preview with fixture data">
        Everything below uses made up answers and SAMPLE lessons for review. Nothing is saved. This page does not exist in staging or production.
      </Alert>

      <section aria-labelledby="pv-dashboard" className="space-y-4">
        <h1 id="pv-dashboard" className="text-4xl">Dashboard building blocks</h1>
        <Card className="border-plum">
          <Eyebrow>Start here</Eyebrow>
          <CardTitle className="mt-2 text-3xl">Start your business audit</CardTitle>
          <p className="mt-2 max-w-prose text-ink-muted">Thirty quick questions show you where your business stands and what to work on first.</p>
          <ButtonLink href="/app/audit" className="mt-5">Start My Business Audit</ButtonLink>
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardTitle className="text-xl">Learning</CardTitle>
            <div className="mt-3"><ProgressBar value={35} label="7 of 20 essential lessons complete" /></div>
          </Card>
          <Card>
            <CardTitle className="text-xl">Business milestones</CardTitle>
            <div className="mt-3"><ProgressBar value={25} label="2 of 8 milestones done" /></div>
          </Card>
        </div>
        <Alert tone="warning" title="A payment did not go through">Your access continues until February 22, 2027. Update your payment method before then to keep everything open.</Alert>
      </section>

      <section aria-labelledby="pv-audit" className="space-y-4">
        <h2 id="pv-audit" className="text-4xl">Audit, resumed at question 7</h2>
        <PreviewStepper initialAnswers={partial} initialQuestion={7} />
      </section>

      <section aria-labelledby="pv-report" className="space-y-4">
        <h2 id="pv-report" className="text-4xl">Audit report</h2>
        <AuditReport
          run={run}
          effectivePath={run.recommendation_snapshot_json.pathRecommendation.path}
          lessonHref={() => null}
          pathChooser={<p className="text-sm text-ink-muted">Path chooser appears here for members.</p>}
          actions={null}
        />
      </section>
    </div>
  );
}
