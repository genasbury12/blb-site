import Link from "next/link";
import type { ReactNode } from "react";
import { formatDate } from "@/components/member/access-states";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle, Eyebrow } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_MODULE, type AuditResult, type Category, type CategoryScore, type LearningPath } from "@/domain/audit/types";
import { PATH_LABELS } from "@/domain/audit/labels";

export type ReportRun = {
  id: string;
  submitted_at: string;
  overall_score: number;
  scoring_version: string;
  category_scores_json: Record<Category, CategoryScore>;
  recommendation_snapshot_json: Omit<AuditResult, "categoryScores">;
};

/** Presentational audit report (FINAL_04 / Phase 2 report contents). Data loading and authorization happen in the page. */
export function AuditReport({
  run,
  effectivePath,
  lessonHref,
  pathChooser,
  actions,
}: {
  run: ReportRun;
  effectivePath: LearningPath;
  lessonHref: (lessonId: string | null) => string | null;
  pathChooser: ReactNode;
  actions: ReactNode;
}) {
  const rec = run.recommendation_snapshot_json;
  const scores = run.category_scores_json;
  return (
    <article className="space-y-8">
      <header>
        <Eyebrow>Business audit report</Eyebrow>
        <h1 className="mt-2 text-4xl sm:text-5xl">Your results from {formatDate(run.submitted_at)}</h1>
        <p className="mt-3 max-w-prose text-sm text-ink-muted">{rec.explanations[0]}</p>
      </header>

      <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
        <Card>
          <Eyebrow>Overall</Eyebrow>
          <p className="mt-1 font-display text-6xl">{Math.round(run.overall_score)}%</p>
          <p className="mt-3 text-sm">
            Recommended path: <strong>{PATH_LABELS[rec.pathRecommendation.path]}</strong>
          </p>
          <p className="mt-1 text-sm text-ink-muted">{rec.pathRecommendation.reason}</p>
          {effectivePath !== rec.pathRecommendation.path ? (
            <p className="mt-2 text-sm">
              You chose: <strong>{PATH_LABELS[effectivePath]}</strong>
            </p>
          ) : null}
        </Card>
        <Card>
          <CardTitle className="text-xl">Scores by area</CardTitle>
          <div className="mt-4 grid gap-3">
            {CATEGORIES.map((c) => (
              <ProgressBar key={c} value={scores[c].display} label={`Module ${CATEGORY_MODULE[c]}: ${CATEGORY_LABELS[c]}`} />
            ))}
          </div>
        </Card>
      </div>

      <section aria-labelledby="priorities">
        <h2 id="priorities" className="text-3xl">Your top three priorities</h2>
        <ol className="mt-4 grid gap-4 md:grid-cols-3">
          {rec.priorityRecommendations.map((p) => (
            <li key={p.rank}>
              <Card className="h-full">
                <Eyebrow>Priority {p.rank}</Eyebrow>
                <CardTitle className="mt-1 text-xl">{p.title}</CardTitle>
                <p className="mt-2 text-sm">{p.reason}</p>
                <p className="mt-3 text-sm font-semibold">Module {p.moduleNumber}: {CATEGORY_LABELS[p.category]}</p>
                {p.lessons.length ? (
                  <ul className="mt-2 space-y-1 text-sm">
                    {p.lessons.map((l) => {
                      const href = lessonHref(l.lessonId);
                      return (
                        <li key={l.lessonId}>
                          {href ? <Link className="text-plum underline underline-offset-4" href={href}>{l.title}</Link> : <span>{l.title}</span>}
                          {l.mappingLevel === "category" ? <span className="text-ink-muted"> (matched by area)</span> : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-ink-muted">Lessons for this module are not published yet.</p>
                )}
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="strengths">
        <h2 id="strengths" className="text-3xl">Where you are strongest</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {rec.strengths.map((s) => (
            <li key={s.category}>
              <Badge>{CATEGORY_LABELS[s.category]}: {s.display}%</Badge>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="roadmap">
        <h2 id="roadmap" className="text-3xl">Your suggested six month roadmap</h2>
        <p className="mt-1 text-sm text-ink-muted">A suggested order, not a deadline. Every module is open now.</p>
        <ol className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {rec.roadmapRecommendation.map((m) => (
            <li key={m.month}>
              <Card className="h-full p-5">
                <Eyebrow>Month {m.month}</Eyebrow>
                <p className="font-semibold">{m.theme}</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {m.items.map((item, i) => (
                    <li key={i}>
                      {item.title}
                      {item.isPriority ? <span className="font-semibold"> (priority)</span> : null}
                    </li>
                  ))}
                </ul>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="path-choice">
        <h2 id="path-choice" className="text-2xl">Change your path</h2>
        <p className="mt-1 max-w-prose text-sm text-ink-muted">You can follow either path. Changing it never changes your answers, scores, or finished work.</p>
        <div className="mt-4">{pathChooser}</div>
      </section>

      <section aria-labelledby="how" className="text-sm text-ink-muted">
        <h2 id="how" className="text-xl text-ink">How this report works</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {rec.explanations.slice(1).map((e) => (
            <li key={e}>{e}</li>
          ))}
          <li>Scoring version: {run.scoring_version}</li>
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">{actions}</div>
    </article>
  );
}
