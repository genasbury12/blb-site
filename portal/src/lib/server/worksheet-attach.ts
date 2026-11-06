import "server-only";
import type { authorizeStaff } from "./staff";
import { errorMessage } from "./form-result";

type StaffSupabase = Awaited<ReturnType<typeof authorizeStaff>>["supabase"];

/**
 * Puts worksheet `slug` on lesson `lessonId` (null detaches it), detaching any worksheet the lesson had: one worksheet
 * per lesson (migration 2500). Runs as the admin, so the audit log records every row that changes.
 */
export async function attachWorksheetTo(supabase: StaffSupabase, slug: string, lessonId: string | null): Promise<string | null> {
  const { error } = await supabase.rpc("attach_worksheet", { p_slug: slug, p_lesson_id: lessonId });
  if (!error) return null;
  if (/Worksheet not found/.test(error.message)) return "That worksheet no longer exists. Refresh the page.";
  if (/Lesson not found/.test(error.message)) return "That lesson no longer exists. Refresh the page.";
  if (/worksheets_one_published_per_lesson_idx/.test(error.message)) return "That lesson already shows a published worksheet. Refresh the page and try again.";
  return errorMessage(new Error(error.message));
}

