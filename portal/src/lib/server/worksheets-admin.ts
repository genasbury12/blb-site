import "server-only";
import type { ResponseRow } from "@/domain/worksheets/admin";
import { worksheetSchemaSchema, type Answers, type WorksheetSchema } from "@/domain/worksheets/schema";
import { logEvent } from "@/lib/observability";
import type { UserSupabase } from "@/lib/supabase/server";
import { getUserEmails } from "./directory";

/**
 * Staff reads of worksheets and answers (Slice D). Runs as the signed in staff member, so row security decides what
 * comes back: admins see every response, coaches only members assigned to them (D09). Never logs answer content.
 */

type WorksheetRow = {
  id: string;
  slug: string;
  version: number;
  title: string;
  status: string;
  schema: unknown;
  lesson_id: string | null;
};

export type StaffWorksheet = {
  slug: string;
  version: number;
  title: string;
  status: string;
  moduleNumber: number | null;
  lessonNumber: number | null;
  /** "Module 1, Lesson 3: Customer research", or null when not attached. */
  lessonLabel: string | null;
  started: number;
  complete: number;
};

/** The version staff work with: the published one, otherwise the newest. */
function pickVersions(rows: WorksheetRow[]) {
  const bySlug = new Map<string, WorksheetRow>();
  for (const r of rows) {
    const cur = bySlug.get(r.slug);
    if (!cur || (r.status === "published" && cur.status !== "published") || (cur.status !== "published" && r.version > cur.version)) bySlug.set(r.slug, r);
  }
  return [...bySlug.values()];
}

async function lessonNumbers(supabase: UserSupabase, lessonIds: string[]) {
  const out = new Map<string, { moduleNumber: number; lessonNumber: number; lessonSlug: string; moduleSlug: string; lessonTitle: string }>();
  if (!lessonIds.length) return out;
  const { data: lessons } = await supabase.from("lessons").select("id, slug, title, order_index, module_id").in("id", lessonIds);
  const moduleIds = [...new Set((lessons ?? []).map((l) => l.module_id as string))];
  const { data: mods } = moduleIds.length ? await supabase.from("modules").select("id, number, slug").in("id", moduleIds) : { data: [] };
  const modOf = new Map((mods ?? []).map((m) => [m.id as string, m]));
  for (const l of lessons ?? []) {
    const m = modOf.get(l.module_id as string);
    if (m) out.set(l.id as string, { moduleNumber: m.number as number, lessonNumber: l.order_index as number, lessonSlug: l.slug as string, moduleSlug: m.slug as string, lessonTitle: l.title as string });
  }
  return out;
}

export async function listStaffWorksheets(supabase: UserSupabase): Promise<StaffWorksheet[]> {
  const { data, error } = await supabase.from("worksheets").select("id, slug, version, title, status, schema, lesson_id");
  if (error) throw new Error(error.message);
  const rows = pickVersions((data ?? []) as WorksheetRow[]);
  const [lessons, responses] = await Promise.all([
    lessonNumbers(supabase, [...new Set(rows.flatMap((r) => (r.lesson_id ? [r.lesson_id] : [])))]),
    // Only slug and status: no answer content is read for the list.
    supabase.from("worksheet_responses").select("worksheet_slug, status"),
  ]);
  if (responses.error) throw new Error(responses.error.message);
  return rows
    .map((r) => {
      const mine = (responses.data ?? []).filter((x) => x.worksheet_slug === r.slug);
      const l = r.lesson_id ? lessons.get(r.lesson_id) : undefined;
      return {
        slug: r.slug,
        version: r.version,
        title: r.title,
        status: r.status,
        moduleNumber: l?.moduleNumber ?? null,
        lessonNumber: l?.lessonNumber ?? null,
        lessonLabel: l ? lessonLabel(l.moduleNumber, l.lessonNumber, l.lessonTitle) : null,
        started: mine.length,
        complete: mine.filter((x) => x.status === "complete").length,
      };
    })
    .sort((a, b) => (a.moduleNumber ?? 99) - (b.moduleNumber ?? 99) || (a.lessonNumber ?? 99) - (b.lessonNumber ?? 99) || a.title.localeCompare(b.title));
}

export type StaffWorksheetDetail = {
  id: string;
  slug: string;
  version: number;
  title: string;
  status: string;
  schema: WorksheetSchema;
  moduleNumber: number | null;
  lessonNumber: number | null;
  lessonId: string | null;
  lessonLabel: string | null;
};

/** One worksheet (published version, otherwise newest), parsed. Null when missing or its schema is invalid. */
export async function loadStaffWorksheet(supabase: UserSupabase, slug: string, version?: number): Promise<StaffWorksheetDetail | null> {
  let q = supabase.from("worksheets").select("id, slug, version, title, status, schema, lesson_id").eq("slug", slug);
  if (version) q = q.eq("version", version);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const row = pickVersions((data ?? []) as WorksheetRow[])[0];
  if (!row) return null;
  const parsed = worksheetSchemaSchema.safeParse(row.schema);
  if (!parsed.success) {
    logEvent("error", "worksheet schema invalid", { slug, issues: parsed.error.issues.length });
    return null;
  }
  const l = row.lesson_id ? (await lessonNumbers(supabase, [row.lesson_id])).get(row.lesson_id) : undefined;
  return {
    id: row.id,
    slug: row.slug,
    version: row.version,
    title: row.title,
    status: row.status,
    schema: parsed.data,
    moduleNumber: l?.moduleNumber ?? null,
    lessonNumber: l?.lessonNumber ?? null,
    lessonId: row.lesson_id ?? null,
    lessonLabel: l ? lessonLabel(l.moduleNumber, l.lessonNumber, l.lessonTitle) : null,
  };
}

export type ResponseFilter = "all" | "in_progress" | "complete";

/** Responses the caller may read, with names (and emails for admins only). */
export async function loadStaffResponses(supabase: UserSupabase, slug: string, opts: { isAdmin: boolean; status?: ResponseFilter }): Promise<ResponseRow[]> {
  let q = supabase
    .from("worksheet_responses")
    .select("id, user_id, status, answers, created_at, updated_at, completed_at")
    .eq("worksheet_slug", slug)
    .order("updated_at", { ascending: false });
  if (opts.status && opts.status !== "all") q = q.eq("status", opts.status);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const ids = [...new Set((data ?? []).map((r) => r.user_id as string))];
  const [profiles, emails] = await Promise.all([
    ids.length ? supabase.from("profiles").select("user_id, display_name").in("user_id", ids) : Promise.resolve({ data: [] }),
    opts.isAdmin ? getUserEmails(ids) : Promise.resolve(new Map<string, string>()),
  ]);
  const nameOf = new Map((profiles.data ?? []).map((p) => [p.user_id as string, (p.display_name as string | null) ?? null]));
  return (data ?? []).map((r) => ({
    id: r.id as string,
    name: nameOf.get(r.user_id as string) ?? "Member",
    email: emails.get(r.user_id as string) ?? null,
    status: r.status as ResponseRow["status"],
    startedAt: r.created_at as string,
    updatedAt: r.updated_at as string,
    completedAt: (r.completed_at as string | null) ?? null,
    answers: (r.answers ?? {}) as Answers,
  }));
}

/** One response for the read only view. RLS returns nothing for a coach's unassigned member. */
export async function loadStaffResponse(supabase: UserSupabase, slug: string, responseId: string) {
  const { data, error } = await supabase
    .from("worksheet_responses")
    .select("id, user_id, worksheet_version, status, answers, created_at, updated_at, completed_at")
    .eq("worksheet_slug", slug)
    .eq("id", responseId)
    .maybeSingle();
  if (error || !data) return null;
  const { data: profile } = await supabase.from("profiles").select("display_name").eq("user_id", data.user_id).maybeSingle();
  return {
    id: data.id as string,
    version: data.worksheet_version as number,
    name: (profile?.display_name as string | null) ?? "Member",
    status: data.status as ResponseRow["status"],
    answers: (data.answers ?? {}) as Answers,
    updatedAt: data.updated_at as string,
    completedAt: (data.completed_at as string | null) ?? null,
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Attaching worksheets to lessons (migration 2500)
// ---------------------------------------------------------------------------------------------------------------

export type LessonOption = { id: string; title: string; orderIndex: number; isSample: boolean; worksheetSlug: string | null; worksheetTitle: string | null };
export type ModuleLessons = { id: string; number: number; title: string; lessons: LessonOption[] };
export type WorksheetOption = { slug: string; title: string; status: string; lessonId: string | null; lessonLabel: string | null };

/** "Module 1, Lesson 3: Customer research", the lesson's real title with where it sits. */
export function lessonLabel(moduleNumber: number, orderIndex: number, title: string) {
  return `Module ${moduleNumber}, Lesson ${orderIndex}: ${title}`;
}

/** Every module with its lessons in order, and the worksheet each lesson carries (one per lesson). */
export async function loadLessonOptions(supabase: UserSupabase): Promise<ModuleLessons[]> {
  const [mods, lessons, sheets] = await Promise.all([
    supabase.from("modules").select("id, number, title").order("number"),
    supabase.from("lessons").select("id, module_id, title, order_index, is_sample").order("order_index"),
    supabase.from("worksheets").select("slug, version, title, status, lesson_id, schema, id"),
  ]);
  const bySlug = pickVersions(((sheets.data ?? []) as WorksheetRow[]).filter((w) => w.lesson_id));
  const onLesson = new Map(bySlug.map((w) => [w.lesson_id as string, w]));
  return (mods.data ?? []).map((m) => ({
    id: m.id as string,
    number: m.number as number,
    title: m.title as string,
    lessons: (lessons.data ?? [])
      .filter((l) => l.module_id === m.id)
      .map((l) => ({
        id: l.id as string,
        title: l.title as string,
        orderIndex: l.order_index as number,
        isSample: Boolean(l.is_sample),
        worksheetSlug: onLesson.get(l.id as string)?.slug ?? null,
        worksheetTitle: onLesson.get(l.id as string)?.title ?? null,
      })),
  }));
}

/** Every worksheet (one row per worksheet, the version staff work with) and the lesson it is attached to. */
export async function loadWorksheetOptions(supabase: UserSupabase, modules?: ModuleLessons[]): Promise<WorksheetOption[]> {
  const [{ data }, mods] = await Promise.all([
    supabase.from("worksheets").select("id, slug, version, title, status, schema, lesson_id"),
    modules ? Promise.resolve(modules) : loadLessonOptions(supabase),
  ]);
  const where = new Map(mods.flatMap((m) => m.lessons.map((l) => [l.id, { m, l }] as const)));
  const rows = pickVersions((data ?? []) as WorksheetRow[]);
  return rows
    .map((w) => {
      const at = w.lesson_id ? where.get(w.lesson_id) : undefined;
      return { slug: w.slug, title: w.title, status: w.status, lessonId: w.lesson_id ?? null, lessonLabel: at ? lessonLabel(at.m.number, at.l.orderIndex, at.l.title) : null, sort: at ? at.m.number * 1000 + at.l.orderIndex : 1e9 };
    })
    .sort((a, b) => a.sort - b.sort || a.title.localeCompare(b.title))
    .map((w) => ({ slug: w.slug, title: w.title, status: w.status, lessonId: w.lessonId, lessonLabel: w.lessonLabel }));
}
