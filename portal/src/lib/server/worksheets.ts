import "server-only";
import { answerText, findField, worksheetSchemaSchema, type Answers, type WorksheetSchema } from "@/domain/worksheets/schema";
import { logEvent } from "@/lib/observability";
import type { UserSupabase } from "@/lib/supabase/server";

export type LessonWorksheet = {
  slug: string;
  version: number;
  title: string;
  schema: WorksheetSchema;
  answers: Answers;
  status: "in_progress" | "complete";
  completedAt: string | null;
  updatedAt: string | null;
  /** Read only quotes from the member's other worksheets, keyed by section key (brief: callbacks). */
  callbacks: Record<string, { label: string; text: string }>;
};

/** Loads the published worksheet for a lesson (RLS hides drafts), parsed and validated. Null when none. */
export async function loadPublishedWorksheet(supabase: UserSupabase, where: { lessonId?: string; slug?: string }) {
  let q = supabase.from("worksheets").select("slug, version, title, schema").eq("status", "published");
  if (where.lessonId) q = q.eq("lesson_id", where.lessonId);
  if (where.slug) q = q.eq("slug", where.slug);
  const { data, error } = await q.order("version", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const parsed = worksheetSchemaSchema.safeParse(data.schema);
  if (!parsed.success) {
    // A malformed schema must never break the lesson page; staff see it in the logs (no answer content).
    logEvent("error", "worksheet schema invalid", { slug: data.slug as string, issues: parsed.error.issues.length });
    return null;
  }
  return { slug: data.slug as string, version: data.version as number, title: data.title as string, schema: parsed.data };
}

export async function loadLessonWorksheet(supabase: UserSupabase, userId: string, lessonId: string): Promise<LessonWorksheet | null> {
  const ws = await loadPublishedWorksheet(supabase, { lessonId });
  if (!ws) return null;
  const { data: resp } = await supabase
    .from("worksheet_responses")
    .select("answers, status, completed_at, updated_at")
    .eq("user_id", userId)
    .eq("worksheet_slug", ws.slug)
    .maybeSingle();

  const callbacks: LessonWorksheet["callbacks"] = {};
  const sources = ws.schema.sections.filter((s) => s.callback).map((s) => s.callback!.worksheet);
  if (sources.length) {
    const [respRes, wsRes] = await Promise.all([
      supabase.from("worksheet_responses").select("worksheet_slug, answers").eq("user_id", userId).in("worksheet_slug", sources),
      supabase.from("worksheets").select("slug, title, schema").eq("status", "published").in("slug", sources),
    ]);
    for (const section of ws.schema.sections) {
      const cb = section.callback;
      if (!cb) continue;
      const src = (wsRes.data ?? []).find((w) => w.slug === cb.worksheet);
      const answers = (respRes.data ?? []).find((r) => r.worksheet_slug === cb.worksheet)?.answers as Answers | undefined;
      const srcSchema = src ? worksheetSchemaSchema.safeParse(src.schema) : null;
      if (!src || !answers || !srcSchema?.success) continue;
      const text = answerText(findField(srcSchema.data, cb.field), answers[cb.field], srcSchema.data).trim();
      if (text) callbacks[section.key] = { label: cb.label ?? (src.title as string), text };
    }
  }

  return {
    ...ws,
    answers: ((resp?.answers as Answers) ?? {}) as Answers,
    status: (resp?.status as LessonWorksheet["status"]) ?? "in_progress",
    completedAt: (resp?.completed_at as string) ?? null,
    updatedAt: (resp?.updated_at as string) ?? null,
    callbacks,
  };
}
