import "server-only";
import { AUDIT_V1 } from "@/domain/audit/v1";
import type { AuditResult, Category, CategoryScore, LearningPath } from "@/domain/audit/types";
import type { UserSupabase } from "@/lib/supabase/server";

export type PublishedVersion = { id: string; versionNumber: number };

/** The published audit version, verified against the canonical source in code. */
export async function loadPublishedAuditVersion(supabase: UserSupabase): Promise<PublishedVersion | null> {
  const { data, error } = await supabase.from("audit_versions").select("id, version_number").eq("status", "published").maybeSingle();
  if (error || !data) return null;
  if (data.version_number !== AUDIT_V1.version) {
    throw new Error(`Published audit version ${data.version_number} has no matching scoring rules in this release.`);
  }
  return { id: data.id as string, versionNumber: data.version_number as number };
}

export type DraftRow = { id: string; answers_json: Record<string, string>; current_question: number; last_saved_at: string };

export async function loadDraft(supabase: UserSupabase, userId: string, versionId: string): Promise<DraftRow | null> {
  const { data } = await supabase
    .from("audit_drafts")
    .select("id, answers_json, current_question, last_saved_at")
    .eq("user_id", userId)
    .eq("version_id", versionId)
    .maybeSingle();
  return (data as DraftRow | null) ?? null;
}

export type RunSummary = { id: string; submitted_at: string; overall_score: number; assigned_path: LearningPath; scoring_version: string };

export async function loadRuns(supabase: UserSupabase, userId: string): Promise<RunSummary[]> {
  const { data, error } = await supabase
    .from("audit_runs")
    .select("id, submitted_at, overall_score, assigned_path, scoring_version")
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({ ...r, overall_score: Number(r.overall_score) })) as RunSummary[];
}

export type RunDetail = RunSummary & {
  category_scores_json: Record<Category, CategoryScore>;
  recommendation_snapshot_json: Omit<AuditResult, "categoryScores">;
};

export async function loadRun(supabase: UserSupabase, runId: string): Promise<RunDetail | null> {
  const { data } = await supabase
    .from("audit_runs")
    .select("id, submitted_at, overall_score, assigned_path, scoring_version, category_scores_json, recommendation_snapshot_json")
    .eq("id", runId)
    .maybeSingle();
  return data ? ({ ...data, overall_score: Number(data.overall_score) } as RunDetail) : null;
}

export async function loadCurrentPath(supabase: UserSupabase): Promise<LearningPath | null> {
  const { data } = await supabase.rpc("my_current_path");
  return (data as LearningPath | null) ?? null;
}

export { PATH_LABELS } from "@/domain/audit/labels";
