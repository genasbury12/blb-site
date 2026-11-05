import "server-only";
import { callbackSourceSlugs, resolveCallbacks, type CallbackSource, type ResolvedTopCallback } from "@/domain/worksheets/callbacks";
import { worksheetSchemaSchema, type Answers, type WorksheetSchema } from "@/domain/worksheets/schema";
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
  /** Quotes shown before section 1 (Lesson 3 "Where you started"), or their missing_text. */
  topCallbacks: ResolvedTopCallback[];
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

  const sources = new Map<string, CallbackSource>();
  const slugs = callbackSourceSlugs(ws.schema);
  if (slugs.length) {
    const [respRes, wsRes] = await Promise.all([
      supabase.from("worksheet_responses").select("worksheet_slug, answers, status").eq("user_id", userId).in("worksheet_slug", slugs),
      supabase.from("worksheets").select("slug, title, schema").eq("status", "published").in("slug", slugs),
    ]);
    for (const src of wsRes.data ?? []) {
      const resp = (respRes.data ?? []).find((r) => r.worksheet_slug === src.slug);
      const parsed = worksheetSchemaSchema.safeParse(src.schema);
      if (!resp || !parsed.success) continue;
      sources.set(src.slug as string, { title: src.title as string, schema: parsed.data, answers: (resp.answers ?? {}) as Answers, status: resp.status as CallbackSource["status"] });
    }
  }
  const resolved = resolveCallbacks(ws.schema, sources);

  return {
    ...ws,
    answers: ((resp?.answers as Answers) ?? {}) as Answers,
    status: (resp?.status as LessonWorksheet["status"]) ?? "in_progress",
    completedAt: (resp?.completed_at as string) ?? null,
    updatedAt: (resp?.updated_at as string) ?? null,
    callbacks: resolved.sections,
    topCallbacks: resolved.top,
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

export type MemberWorksheetStatus = "not_started" | "in_progress" | "complete";
export type MemberWorksheetModule = {
  moduleNumber: number;
  moduleSlug: string;
  moduleTitle: string;
  anyComplete: boolean;
  items: { slug: string; title: string; lessonNumber: number; lessonTitle: string; href: string; status: MemberWorksheetStatus }[];
};

/**
 * Every published worksheet the member can open, grouped by module, with their own status (Library "Your
 * worksheets"). RLS only returns worksheets on lessons the member can see, so modules outside their access never
 * appear. Reads status only, never answers.
 */
export async function loadMemberWorksheets(supabase: UserSupabase, userId: string): Promise<MemberWorksheetModule[]> {
  const { data: worksheets, error } = await supabase.from("worksheets").select("slug, title, lesson_id").eq("status", "published");
  if (error) throw new Error(error.message);
  if (!worksheets?.length) return [];
  const lessonIds = [...new Set(worksheets.map((w) => w.lesson_id as string))];
  const [lessonsRes, respRes] = await Promise.all([
    supabase.from("lessons").select("id, slug, title, order_index, module_id").in("id", lessonIds),
    supabase.from("worksheet_responses").select("worksheet_slug, status").eq("user_id", userId).in("worksheet_slug", worksheets.map((w) => w.slug as string)),
  ]);
  const lessons = new Map((lessonsRes.data ?? []).map((l) => [l.id as string, l]));
  const moduleIds = [...new Set((lessonsRes.data ?? []).map((l) => l.module_id as string))];
  const { data: mods } = moduleIds.length ? await supabase.from("modules").select("id, slug, number, title").in("id", moduleIds) : { data: [] };
  const modOf = new Map((mods ?? []).map((m) => [m.id as string, m]));
  const statusOf = new Map((respRes.data ?? []).map((r) => [r.worksheet_slug as string, r.status as "in_progress" | "complete"]));

  const groups = new Map<string, MemberWorksheetModule>();
  for (const w of worksheets) {
    const lesson = lessons.get(w.lesson_id as string);
    const mod = lesson ? modOf.get(lesson.module_id as string) : undefined;
    if (!lesson || !mod) continue;
    const g = groups.get(mod.id as string) ?? { moduleNumber: mod.number as number, moduleSlug: mod.slug as string, moduleTitle: mod.title as string, anyComplete: false, items: [] };
    const status: MemberWorksheetStatus = statusOf.get(w.slug as string) ?? "not_started";
    g.items.push({
      slug: w.slug as string,
      title: w.title as string,
      lessonNumber: lesson.order_index as number,
      lessonTitle: lesson.title as string,
      href: `/app/training/${mod.slug}/${lesson.slug}#your-worksheet`,
      status,
    });
    g.anyComplete ||= status === "complete";
    groups.set(mod.id as string, g);
  }
  return [...groups.values()]
    .map((g) => ({ ...g, items: g.items.sort((a, b) => a.lessonNumber - b.lessonNumber) }))
    .sort((a, b) => a.moduleNumber - b.moduleNumber);
}

/**
 * The member's most recently saved worksheet that is still in progress, on a published worksheet they can open
 * (dashboard: "Finish your Lesson N worksheet"). Reads status only, never answers.
 */
export async function loadUnfinishedWorksheet(supabase: UserSupabase, userId: string) {
  const { data: open } = await supabase
    .from("worksheet_responses")
    .select("worksheet_slug, updated_at")
    .eq("user_id", userId)
    .eq("status", "in_progress")
    .order("updated_at", { ascending: false })
    .limit(10);
  if (!open?.length) return null;
  const { data: sheets } = await supabase.from("worksheets").select("slug, title, lesson_id").eq("status", "published").in("slug", open.map((r) => r.worksheet_slug as string));
  const sheet = open.map((r) => (sheets ?? []).find((w) => w.slug === r.worksheet_slug)).find(Boolean);
  if (!sheet) return null;
  const { data: lesson } = await supabase.from("lessons").select("slug, order_index, module_id").eq("id", sheet.lesson_id).maybeSingle();
  if (!lesson) return null;
  const { data: mod } = await supabase.from("modules").select("slug, number").eq("id", lesson.module_id).maybeSingle();
  if (!mod) return null;
  return {
    title: sheet.title as string,
    lessonNumber: lesson.order_index as number,
    moduleNumber: mod.number as number,
    href: `/app/training/${mod.slug}/${lesson.slug}#your-worksheet`,
  };
}
