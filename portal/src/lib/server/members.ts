import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** Staff actions only: a member's email and first name for notifications. Never sent to the browser. */
export async function memberContact(userId: string): Promise<{ email: string | null; name: string | null }> {
  try {
    const admin = createSupabaseAdminClient();
    const [u, p] = await Promise.all([admin.auth.admin.getUserById(userId), admin.from("profiles").select("display_name").eq("user_id", userId).maybeSingle()]);
    return { email: u.data.user?.email ?? null, name: (p.data?.display_name as string | null) ?? null };
  } catch {
    return { email: null, name: null };
  }
}
