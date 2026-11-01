import { scoreAudit } from "./score";
import type { AuditResult, AuditVersion, CatalogLesson } from "./types";

/**
 * Turns a completed draft into the rows written at submission. Pure and deterministic so it can be
 * unit tested; the server action only authenticates, loads inputs, and persists these rows.
 * Nothing here deletes or edits existing progress, runs, or roadmap items (D13).
 */
export type RunRecord = {
  user_id: string;
  version_id: string;
  scoring_version: string;
  answers_snapshot_json: Record<string, string>;
  category_scores_json: AuditResult["categoryScores"];
  overall_score: number;
  assigned_path: AuditResult["pathRecommendation"]["path"];
  recommendation_snapshot_json: Omit<AuditResult, "categoryScores">;
};

export type RoadmapRecord = {
  user_id: string;
  month_number: number;
  priority_order: number;
  title: string;
  reason: string;
  recommended_module_number: number | null;
  recommended_lesson_id: string | null;
};

export function buildSubmission(input: {
  userId: string;
  versionId: string;
  version: AuditVersion;
  answers: Record<string, unknown>;
  catalog: CatalogLesson[];
}): { result: AuditResult; run: RunRecord; roadmap: RoadmapRecord[] } {
  const result = scoreAudit(input.version, input.answers, input.catalog);
  const { categoryScores, ...recommendation } = result;
  const run: RunRecord = {
    user_id: input.userId,
    version_id: input.versionId,
    scoring_version: result.scoringVersion,
    answers_snapshot_json: { ...(input.answers as Record<string, string>) },
    category_scores_json: categoryScores,
    overall_score: Math.round(result.overallScore.percent * 1000) / 1000,
    assigned_path: result.pathRecommendation.path,
    recommendation_snapshot_json: recommendation,
  };
  const roadmap: RoadmapRecord[] = result.roadmapRecommendation.flatMap((month) =>
    month.items.map((item, i) => ({
      user_id: input.userId,
      month_number: month.month,
      priority_order: i + 1,
      title: item.title,
      reason: item.reason,
      recommended_module_number: item.moduleNumber,
      recommended_lesson_id: item.lessonId,
    })),
  );
  return { result, run, roadmap };
}

/** Roadmap month (1 to 6) for a curriculum activation date; advisory only, never a lock. */
export function currentRoadmapMonth(activation: Date | null, now: Date): number {
  if (!activation || now < activation) return 1;
  const months =
    (now.getUTCFullYear() - activation.getUTCFullYear()) * 12 +
    (now.getUTCMonth() - activation.getUTCMonth()) -
    (now.getUTCDate() < activation.getUTCDate() ? 1 : 0);
  return Math.min(6, Math.max(1, months + 1));
}
