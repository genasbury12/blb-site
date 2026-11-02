import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { IntegrationNotConfigured } from "./integrations";

export type DirectoryUser = { id: string; email: string | null; created_at: string; last_sign_in_at: string | null; confirmed: boolean };

/** Staff directory (emails). Server only, called after authorizeStaff/requireStaff. */
export async function listUsers(search: string | null, page = 1): Promise<{ users: DirectoryUser[]; hasMore: boolean }> {
  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    throw new IntegrationNotConfigured("supabase-service-role");
  }
  const perPage = 50;
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
  if (error) throw new Error(error.message);
  const term = search?.trim().toLowerCase();
  const users = data.users
    .filter((u) => !term || (u.email ?? "").toLowerCase().includes(term))
    .map((u) => ({ id: u.id, email: u.email ?? null, created_at: u.created_at, last_sign_in_at: u.last_sign_in_at ?? null, confirmed: Boolean(u.email_confirmed_at) }));
  return { users, hasMore: data.users.length === perPage };
}

export async function getUserEmail(id: string): Promise<string | null> {
  try {
    const { data } = await createSupabaseAdminClient().auth.admin.getUserById(id);
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}
