import "server-only";
import type { UserSupabase } from "@/lib/supabase/server";

export async function authorNames(supabase: UserSupabase, ids: (string | null)[]): Promise<Map<string, { name: string; staff: boolean }>> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (!unique.length) return new Map();
  const { data } = await supabase.rpc("community_authors", { p_ids: unique });
  return new Map(((data ?? []) as { user_id: string; display_name: string; is_staff: boolean }[]).map((r) => [r.user_id, { name: r.display_name, staff: r.is_staff }]));
}
