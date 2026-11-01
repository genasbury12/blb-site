import "server-only";
import type { CatalogLesson } from "@/domain/audit/types";
import type { UserSupabase } from "@/lib/supabase/server";

export type ModuleRow = { id: string; number: number; slug: string; title: string; outcome: string };
export type LessonRow = {
  id: string;
  module_id: string;
  slug: string;
  order_index: number;
  essential: boolean;
  title: string;
  objective: string | null;
  assignment: string | null;
  transcript: string | null;
  video_provider: string | null;
  video_provider_id: string | null;
  captions_ready: boolean;
  duration_seconds: number | null;
  is_sample: boolean;
  status: CatalogLesson["status"];
};
export type ResourceRow = { id: string; label: string; mime_type: string };

const LESSON_COLUMNS =
  "id, module_id, slug, order_index, essential, title, objective, assignment, transcript, video_provider, video_provider_id, captions_ready, duration_seconds, is_sample, status";

/** Modules and lessons the student may see. RLS returns published content only, and only with an active curriculum grant. */
export async function loadCatalog(supabase: UserSupabase) {
  const [modules, lessons] = await Promise.all([
    supabase.from("modules").select("id, number, slug, title, outcome").eq("status", "published").order("number"),
    supabase.from("lessons").select(LESSON_COLUMNS).eq("status", "published").order("order_index"),
  ]);
  if (modules.error) throw new Error(modules.error.message);
  if (lessons.error) throw new Error(lessons.error.message);
  return { modules: (modules.data ?? []) as ModuleRow[], lessons: (lessons.data ?? []) as LessonRow[] };
}

export function toCatalogLessons(modules: ModuleRow[], lessons: LessonRow[]): CatalogLesson[] {
  const byId = new Map(modules.map((m) => [m.id, m.number]));
  return lessons
    .filter((l) => byId.has(l.module_id))
    .map((l) => ({
      id: l.id,
      moduleNumber: byId.get(l.module_id)!,
      orderIndex: l.order_index,
      title: l.title,
      essential: l.essential,
      status: l.status,
    }));
}

export async function loadCompletedLessonIds(supabase: UserSupabase, userId: string): Promise<Set<string>> {
  const { data, error } = await supabase.from("lesson_progress").select("lesson_id").eq("user_id", userId);
  if (error) throw new Error(error.message);
  return new Set((data ?? []).map((r: { lesson_id: string }) => r.lesson_id));
}

export async function loadMilestoneSummary(supabase: UserSupabase, userId: string) {
  const [milestones, progress] = await Promise.all([
    supabase.from("milestones").select("id").eq("status", "published"),
    supabase.from("milestone_progress").select("milestone_id, state").eq("user_id", userId),
  ]);
  const total = milestones.data?.length ?? 0;
  const done = (progress.data ?? []).filter((p: { state: string }) => p.state === "done").length;
  return { total, done };
}

export async function loadLessonResources(supabase: UserSupabase, lessonId: string): Promise<ResourceRow[]> {
  const { data } = await supabase.from("lesson_resources").select("id, label, mime_type").eq("lesson_id", lessonId).eq("published", true);
  return (data ?? []) as ResourceRow[];
}

/** Earliest active curriculum grant start: used for the advisory roadmap month and access dates. */
export async function loadGrants(supabase: UserSupabase, userId: string) {
  const { data, error } = await supabase
    .from("entitlements")
    .select("feature_key, starts_at, ends_at, state, source_type")
    .eq("user_id", userId)
    .eq("state", "active");
  if (error) throw new Error(error.message);
  return (data ?? []) as { feature_key: string; starts_at: string; ends_at: string | null; state: string; source_type: string }[];
}

export function latestEnd(grants: { feature_key: string; ends_at: string | null }[], feature: string): Date | null {
  const ends = grants.filter((g) => g.feature_key === feature && g.ends_at).map((g) => new Date(g.ends_at!).getTime());
  return ends.length ? new Date(Math.max(...ends)) : null;
}
