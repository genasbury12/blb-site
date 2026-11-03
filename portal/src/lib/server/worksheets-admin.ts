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
  slug: string;
  version: number;
  title: string;
  status: string;
  schema: unknown;
  lesson_id: string;
};

export type StaffWorksheet = {
  slug: string;
  version: number;
  title: string;
  status: string;
  moduleNumber: number | null;
  lessonNumber: number | null;
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
  const out = new Map<string, { moduleNumber: number; lessonNumber: number; lessonSlug: string; moduleSlug: string }>();
  if (!lessonIds.length) return out;
  const { data: lessons } = await supabase.from("lessons").select("id, slug, order_index, module_id").in("id", lessonIds);
  const moduleIds = [...new Set((lessons ?? []).map((l) => l.module_id as string))];
  const { data: mods } = moduleIds.length ? await supabase.from("modules").select("id, number, slug").in("id", moduleIds) : { data: [] };
  const modOf = new Map((mods ?? []).map((m) => [m.id as string, m]));
  for (const l of lessons ?? []) {
    const m = modOf.get(l.module_id as string);
    if (m) out.set(l.id as string, { moduleNumber: m.number as number, lessonNumber: l.order_index as number, lessonSlug: l.slug as string, moduleSlug: m.slug as string });
  }
  return out;
}

export async function listStaffWorksheets(supabase: UserSupabase): Promise<StaffWorksheet[]> {
  const { data, error } = await supabase.from("worksheets").select("slug, version, title, status, schema, lesson_id");
  if (error) throw new Error(error.message);
  const rows = pickVersions((data ?? []) as WorksheetRow[]);
  const [lessons, responses] = await Promise.all([
    lessonNumbers(supabase, [...new Set(rows.map((r) => r.lesson_id))]),
    // Only slug and status: no answer content is read for the list.
    supabase.from("worksheet_responses").select("worksheet_slug, status"),
  ]);
  if (responses.error) throw new Error(responses.error.message);
  return rows
    .map((r) => {
      const mine = (responses.data ?? []).filter((x) => x.worksheet_slug === r.slug);
      const l = lessons.get(r.lesson_id);
      return {
        slug: r.slug,
        version: r.version,
        title: r.title,
        status: r.status,
        moduleNumber: l?.moduleNumber ?? null,
        lessonNumber: l?.lessonNumber ?? null,
        started: mine.length,
        complete: mine.filter((x) => x.status === "complete").length,
      };
    })
    .sort((a, b) => (a.moduleNumber ?? 99) - (b.moduleNumber ?? 99) || (a.lessonNumber ?? 99) - (b.lessonNumber ?? 99) || a.title.localeCompare(b.title));
}

export type StaffWorksheetDetail = {
  slug: string;
  version: number;
  title: string;
  status: string;
  schema: WorksheetSchema;
  moduleNumber: number | null;
  lessonNumber: number | null;
};

/** One worksheet (published version, otherwise newest), parsed. Null when missing or its schema is invalid. */
export async function loadStaffWorksheet(supabase: UserSupabase, slug: string, version?: number): Promise<StaffWorksheetDetail | null> {
  let q = supabase.from("worksheets").select("slug, version, title, status, schema, lesson_id").eq("slug", slug);
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
  const l = (await lessonNumbers(supabase, [row.lesson_id])).get(row.lesson_id);
  return { slug: row.slug, version: row.version, title: row.title, status: row.status, schema: parsed.data, moduleNumber: l?.moduleNumber ?? null, lessonNumber: l?.lessonNumber ?? null };
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
