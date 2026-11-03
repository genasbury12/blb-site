"use server";

import { z } from "zod";
import { validateAnswersPatch, WorksheetAnswerError, worksheetProgress, type Answers } from "@/domain/worksheets/schema";
import { logEvent } from "@/lib/observability";
import { authorize, NotEntitledError } from "@/lib/server/session";
import { loadPublishedWorksheet } from "@/lib/server/worksheets";

export type WorksheetSaveResult = { ok: true; savedAt: string } | { ok: false; error: string; retry: boolean };
export type WorksheetCompleteResult = { ok: true; completedAt: string; milestone: boolean } | { ok: false; error: string };

const slug = z.string().regex(/^[a-z0-9-]{3,80}$/);
const saveInput = z.object({ slug, patch: z.record(z.string(), z.unknown()) });

function fail(err: unknown, slugValue: string, what: string): { ok: false; error: string; retry: boolean } {
  if (err instanceof WorksheetAnswerError) return { ok: false, error: err.message, retry: false };
  if (err instanceof NotEntitledError) return { ok: false, error: "Your access does not include this worksheet. Check My Account.", retry: false };
  if (err instanceof Error && err.message === "Not signed in") return { ok: false, error: "Your session ended. Sign in again to keep saving.", retry: false };
  // Privacy: never log answer content, only the worksheet and what failed.
  logEvent("error", `worksheet ${what} failed`, { slug: slugValue, error: err instanceof Error ? err.message : String(err) });
  return { ok: false, error: "Not saved, retrying", retry: true };
}

/** Autosave: validates the changed answers against the published worksheet, then merges them (RLS as the member). */
export async function saveWorksheetAnswers(input: unknown): Promise<WorksheetSaveResult> {
  const parsed = saveInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That answer could not be saved. Refresh and try again.", retry: false };
  const { slug: s, patch } = parsed.data;
  try {
    const { supabase } = await authorize("curriculum.read");
    const ws = await loadPublishedWorksheet(supabase, { slug: s });
    if (!ws) return { ok: false, error: "This worksheet is not available.", retry: false };
    const clean = validateAnswersPatch(ws.schema, patch);
    const { data, error } = await supabase.rpc("save_worksheet_answers", { p_slug: s, p_patch: clean });
    if (error) throw new Error(error.message);
    logEvent("info", "worksheet saved", { slug: s, fields: Object.keys(clean) });
    return { ok: true, savedAt: (data as { updated_at: string }).updated_at };
  } catch (err) {
    return fail(err, s, "save");
  }
}

/** Complete: only when every required answer is filled (checked on the server), then ticks the milestone. */
export async function completeWorksheet(input: unknown): Promise<WorksheetCompleteResult> {
  const parsed = z.object({ slug }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Refresh and try again." };
  const s = parsed.data.slug;
  try {
    const { supabase, user } = await authorize("curriculum.read");
    const ws = await loadPublishedWorksheet(supabase, { slug: s });
    if (!ws) return { ok: false, error: "This worksheet is not available." };
    const { data: resp } = await supabase.from("worksheet_responses").select("answers").eq("user_id", user.id).eq("worksheet_slug", s).maybeSingle();
    const progress = worksheetProgress(ws.schema, (resp?.answers as Answers) ?? {});
    if (progress.percent < 100) return { ok: false, error: `Answer the remaining ${progress.missing.length} required ${progress.missing.length === 1 ? "question" : "questions"} first.` };
    const { data, error } = await supabase.rpc("complete_worksheet", { p_slug: s });
    if (error) throw new Error(error.message);
    const r = data as { completed_at: string; milestone: boolean };
    logEvent("info", "worksheet completed", { slug: s, milestone: r.milestone });
    return { ok: true, completedAt: r.completed_at, milestone: r.milestone };
  } catch (err) {
    const f = fail(err, s, "complete");
    return { ok: false, error: f.retry ? "That did not go through. Try again in a moment." : f.error };
  }
}
