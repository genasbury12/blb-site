import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuditReport, type ReportRun } from "@/components/audit/audit-report";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Card, Eyebrow } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { NavLink } from "@/components/member/nav-link";
import { AppShell } from "@/components/shell/app-shell";
import { Ornament } from "@/components/shell/page-header";
import { MEMBER_NAV } from "@/lib/features";
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
    <AppShell
      home="/preview"
      label="Business System"
      nav={
        <nav aria-label="Preview navigation">
          <ul className="space-y-1">
            {MEMBER_NAV.map((i) => (
              <li key={i.href}><NavLink href={i.href === "/app" ? "/preview" : i.href} icon={i.icon} exact>{i.label}</NavLink></li>
            ))}
          </ul>
        </nav>
      }
    >
    <div className="space-y-12">
      <Alert tone="warning" title="Design preview with fixture data">
        Everything below uses made up answers and SAMPLE lessons for review. Nothing is saved. This page does not exist in staging or production.
      </Alert>

      <section aria-labelledby="pv-dashboard" className="space-y-6">
        <header>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-mauve-ink">Monday, February 15</p>
          <h1 id="pv-dashboard" className="mt-2 font-display text-[2.6rem] font-medium leading-[1.05] sm:text-[3.4rem]">Good morning, Jordan</h1>
          <Ornament className="mt-5" />
          <p className="mt-4 text-ink-muted">Your path: Build From Scratch</p>
        </header>
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <Card tone="feature" className="relative overflow-hidden p-8 sm:p-10">
            <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-rose/40 blur-2xl" />
            <Eyebrow>Recommended from your audit</Eyebrow>
            <h2 className="mt-3 max-w-xl font-display text-[2.2rem] font-medium leading-tight">SAMPLE: Module 1 lesson 3</h2>
            <p className="mt-3 max-w-prose text-ink-muted">This is the starting lesson matched to your top priority.</p>
            <ButtonLink href="/app/audit" className="mt-6">Open lesson</ButtonLink>
          </Card>
          <Card className="flex flex-col justify-between">
            <div>
              <Eyebrow>Roadmap month 1 of 6</Eyebrow>
              <p className="mt-2 font-display text-[1.8rem] leading-tight">Clarity &amp; Foundation</p>
              <p className="mt-2 text-sm text-ink-muted">A suggested focus, not a deadline.</p>
            </div>
            <div className="mt-6 space-y-4">
              <ProgressBar value={35} label="7 of 20 essential lessons" />
              <ProgressBar value={25} label="2 of 8 business milestones" />
            </div>
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
    </AppShell>
  );
}
