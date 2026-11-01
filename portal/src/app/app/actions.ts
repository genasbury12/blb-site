"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AuditValidationError } from "@/domain/audit/score";
import { buildSubmission } from "@/domain/audit/submission";
import { AUDIT_V1 } from "@/domain/audit/v1";
import { logEvent } from "@/lib/observability";
import { loadDraft, loadPublishedAuditVersion } from "@/lib/server/audit";
import { loadCatalog, toCatalogLessons } from "@/lib/server/learning";
import { authorize, NotEntitledError } from "@/lib/server/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type MutationResult = { ok: true; savedAt?: string } | { ok: false; error: string };

const QUESTION_CODES = AUDIT_V1.questions.map((q) => q.code) as [string, ...string[]];

function failure(err: unknown, fallback: string): MutationResult {
  if (err instanceof NotEntitledError) return { ok: false, error: "Your access does not include this. Check My Account for your access dates." };
  if (err instanceof Error && err.message === "Not signed in") return { ok: false, error: "Your session ended. Sign in again to continue." };
  logEvent("error", fallback, { error: err instanceof Error ? err.message : String(err) });
  return { ok: false, error: fallback };
}

// ---------------------------------------------------------------- audit

const saveAnswerSchema = z.object({
  code: z.enum(QUESTION_CODES),
  value: z.enum(["A", "B", "C", "D"]),
  currentQuestion: z.number().int().min(1).max(AUDIT_V1.questions.length),
});

/** Autosave one answer (handoff 01: autosave every answer). Runs under RLS as the user. */
export async function saveAuditAnswer(input: unknown): Promise<MutationResult> {
  const parsed = saveAnswerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That answer could not be saved. Refresh and try again." };
  try {
    const { supabase, user } = await authorize("audit.use");
    const version = await loadPublishedAuditVersion(supabase);
    if (!version) return { ok: false, error: "The audit is not available right now." };
    const draft = await loadDraft(supabase, user.id, version.id);
    const answers = { ...(draft?.answers_json ?? {}), [parsed.data.code]: parsed.data.value };
    const { data, error } = await supabase
      .from("audit_drafts")
      .upsert(
        { user_id: user.id, version_id: version.id, answers_json: answers, current_question: parsed.data.currentQuestion },
        { onConflict: "user_id,version_id" },
      )
      .select("last_saved_at")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, savedAt: data.last_saved_at as string };
  } catch (err) {
    return failure(err, "Your answer was not saved. Check your connection and try again.");
  }
}

/** Remember position without changing answers (Back and Resume). */
export async function saveAuditPosition(input: unknown): Promise<MutationResult> {
  const parsed = z.object({ currentQuestion: z.number().int().min(1).max(AUDIT_V1.questions.length) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid position." };
  try {
    const { supabase, user } = await authorize("audit.use");
    const version = await loadPublishedAuditVersion(supabase);
    if (!version) return { ok: false, error: "The audit is not available right now." };
    const { error } = await supabase
      .from("audit_drafts")
      .update({ current_question: parsed.data.currentQuestion })
      .eq("user_id", user.id)
      .eq("version_id", version.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  } catch (err) {
    return failure(err, "Your place was not saved.");
  }
}

/**
 * Score and store an immutable run. Scores are computed here by the deterministic engine and written
 * with the service role, because clients have no insert permission on audit_runs (scores cannot be forged).
 * Prior runs, lesson progress, milestones, and roadmap items are never modified (D13).
 */
export async function submitAudit(): Promise<MutationResult> {
  let runId: string;
  try {
    const { supabase, user } = await authorize("audit.use");
    const version = await loadPublishedAuditVersion(supabase);
    if (!version) return { ok: false, error: "The audit is not available right now." };
    const draft = await loadDraft(supabase, user.id, version.id);
    if (!draft) return { ok: false, error: "Answer the questions first, then submit." };

    const { modules, lessons } = await loadCatalog(supabase);
    const { run, roadmap } = buildSubmission({
      userId: user.id,
      versionId: version.id,
      version: AUDIT_V1,
      answers: draft.answers_json,
      catalog: toCatalogLessons(modules, lessons),
    });

    // Atomic: run, roadmap items, onboarding state, and draft consumption commit together.
    const admin = createSupabaseAdminClient();
    const recorded = await admin.rpc("record_audit_submission", { p_run: run, p_roadmap: roadmap, p_draft_id: draft.id });
    if (recorded.error) throw new Error(recorded.error.message);
    runId = recorded.data as string;
  } catch (err) {
    if (err instanceof AuditValidationError) {
      return { ok: false, error: `Please answer every question before submitting. Still open: ${err.missing.join(", ")}.` };
    }
    return failure(err, "Your audit was not submitted. Your answers are still saved, so try again in a moment.");
  }
  revalidatePath("/app");
  redirect(`/app/audit/results/${runId}`);
}

const pathSchema = z.object({
  runId: z.string().uuid(),
  path: z.enum(["build_from_scratch", "optimize_automate"]),
  reason: z.string().trim().max(500).optional(),
});

/** Student chooses a path (D13). Answers and scores never change; the choice is logged with time. */
export async function choosePath(input: unknown): Promise<MutationResult> {
  const parsed = pathSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Choose one of the two paths." };
  try {
    const { supabase, user } = await authorize("audit.use");
    const { error } = await supabase.from("path_overrides").insert({
      user_id: user.id,
      actor_id: user.id,
      audit_run_id: parsed.data.runId,
      chosen_path: parsed.data.path,
      reason: parsed.data.reason || null,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/app");
    return { ok: true };
  } catch (err) {
    return failure(err, "Your path choice was not saved.");
  }
}

// ---------------------------------------------------------------- learning

const lessonSchema = z.object({ lessonId: z.string().uuid(), complete: z.boolean() });

/** Mark or unmark a lesson complete. RLS allows only published lessons with an active curriculum grant. */
export async function setLessonComplete(input: unknown): Promise<MutationResult> {
  const parsed = lessonSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid lesson." };
  try {
    const { supabase, user } = await authorize("curriculum.read");
    const result = parsed.data.complete
      ? await supabase.from("lesson_progress").upsert({ user_id: user.id, lesson_id: parsed.data.lessonId }, { onConflict: "user_id,lesson_id", ignoreDuplicates: true })
      : await supabase.from("lesson_progress").delete().eq("user_id", user.id).eq("lesson_id", parsed.data.lessonId);
    if (result.error) throw new Error(result.error.message);
    revalidatePath("/app", "layout");
    return { ok: true };
  } catch (err) {
    return failure(err, "Your progress was not saved.");
  }
}

const roadmapSchema = z.object({ itemId: z.string().uuid(), done: z.boolean() });

export async function setRoadmapItemDone(input: unknown): Promise<MutationResult> {
  const parsed = roadmapSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid roadmap item." };
  try {
    const { supabase, user } = await authorize("roadmap.use");
    const { data, error } = await supabase
      .from("roadmap_items")
      .update(parsed.data.done ? { state: "done", completed_at: new Date().toISOString() } : { state: "open", completed_at: null })
      .eq("id", parsed.data.itemId)
      .eq("user_id", user.id)
      .select("id");
    if (error) throw new Error(error.message);
    if (!data?.length) return { ok: false, error: "That roadmap item was not found." };
    revalidatePath("/app/roadmap");
    return { ok: true };
  } catch (err) {
    return failure(err, "Your roadmap was not updated.");
  }
}

// ---------------------------------------------------------------- account

const profileSchema = z.object({ displayName: z.string().trim().min(1, "Enter a name.").max(80) });

export async function updateProfile(input: unknown): Promise<MutationResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid name." };
  try {
    const { supabase, user } = await authorize(null);
    const { error } = await supabase.from("profiles").update({ display_name: parsed.data.displayName }).eq("user_id", user.id);
    if (error) throw new Error(error.message);
    revalidatePath("/app", "layout");
    return { ok: true };
  } catch (err) {
    return failure(err, "Your name was not saved.");
  }
}
