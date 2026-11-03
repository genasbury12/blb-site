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

export type WorksheetPdfContext = {
  slug: string;
  moduleNumber: number;
  lessonNumber: number;
  worksheet: LessonWorksheet;
};

async function lessonContext(supabase: UserSupabase, lessonId: string) {
  const { data: lesson } = await supabase.from("lessons").select("id, order_index, module_id").eq("id", lessonId).maybeSingle();
  if (!lesson) return null;
  const { data: mod } = await supabase.from("modules").select("number").eq("id", lesson.module_id).maybeSingle();
  if (!mod) return null;
  return { lessonNumber: lesson.order_index as number, moduleNumber: mod.number as number };
}

/** One worksheet for the PDF route: the member's own answers on a published, visible worksheet. */
export async function loadWorksheetPdfContext(supabase: UserSupabase, userId: string, slug: string): Promise<WorksheetPdfContext | null> {
  const { data } = await supabase.from("worksheets").select("lesson_id").eq("slug", slug).eq("status", "published").maybeSingle();
  if (!data) return null;
  const [ctx, worksheet] = await Promise.all([lessonContext(supabase, data.lesson_id as string), loadLessonWorksheet(supabase, userId, data.lesson_id as string)]);
  if (!ctx || !worksheet) return null;
  return { slug, ...ctx, worksheet };
}

/** Every completed worksheet the member has in a module, in lesson order (brief: module PDF at Lesson 9). */
export async function loadModuleWorksheetPdfContexts(supabase: UserSupabase, userId: string, moduleSlug: string) {
  const { data: mod } = await supabase.from("modules").select("id, number").eq("slug", moduleSlug).maybeSingle();
  if (!mod) return null;
  const { data: lessons } = await supabase.from("lessons").select("id, order_index").eq("module_id", mod.id).order("order_index");
  const out: WorksheetPdfContext[] = [];
  for (const l of lessons ?? []) {
    const ws = await loadLessonWorksheet(supabase, userId, l.id as string);
    if (ws && ws.status === "complete") out.push({ slug: ws.slug, moduleNumber: mod.number as number, lessonNumber: l.order_index as number, worksheet: ws });
  }
  return { moduleNumber: mod.number as number, items: out };
}

export async function memberDisplayName(supabase: UserSupabase, userId: string) {
  const { data } = await supabase.from("profiles").select("display_name").eq("user_id", userId).maybeSingle();
  return (data?.display_name as string | null) ?? null;
}
