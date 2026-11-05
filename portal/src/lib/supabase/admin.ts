import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";

/**
 * Service role client. Bypasses RLS. Server only, used for writes that clients must never make directly (scored
 * audit runs, entitlement grants from verified Stripe events), staff directory lookups, and reading one member's
 * own data for their data export (10_DATA_RIGHTS), where every query is filtered to that member.
 * Callers must authenticate and authorize the user first.
 */
export function createSupabaseAdminClient() {
  const url = publicEnv().NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service role is not configured for this environment.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
