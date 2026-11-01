import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { isFeatureKey, type FeatureKey } from "@/lib/features";
import { createSupabaseServerClient, type UserSupabase } from "@/lib/supabase/server";

/**
 * Data Access Layer: the only place pages and actions learn who the user is and what they may do.
 * Identity is verified with the Auth server (getUser), never taken from client input.
 */
export type SessionUser = { id: string; email: string | null };

export const getSession = cache(async (): Promise<{ supabase: UserSupabase; user: SessionUser } | null> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { supabase, user: { id: data.user.id, email: data.user.email ?? null } };
});

export async function requireSession(nextPath = "/app") {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return session;
}

/** Active features resolved by Postgres (app.has_feature): windows, grace, disputes, refunds. */
export const getFeatures = cache(async (): Promise<ReadonlySet<FeatureKey>> => {
  const session = await getSession();
  if (!session) return new Set();
  const { data, error } = await session.supabase.rpc("my_features");
  if (error) throw new Error(`Could not load access: ${error.message}`);
  const keys = (Array.isArray(data) ? data : []).map((row: unknown) =>
    typeof row === "string" ? row : (row as { my_features?: string }).my_features,
  );
  return new Set(keys.filter(isFeatureKey));
});

export type BillingNotice = { source: string; graceEndsAt: string; suspended: boolean };

export const getBillingNotices = cache(async (): Promise<BillingNotice[]> => {
  const session = await getSession();
  if (!session) return [];
  const { data, error } = await session.supabase.rpc("my_billing_notice");
  if (error) return [];
  return (data ?? []).map((r: { source: string; grace_ends_at: string; suspended: boolean }) => ({
    source: r.source,
    graceEndsAt: r.grace_ends_at,
    suspended: r.suspended,
  }));
});

export class NotEntitledError extends Error {
  constructor(readonly feature: FeatureKey) {
    super(`Not entitled: ${feature}`);
    this.name = "NotEntitledError";
  }
}

/** For server actions: authenticate and authorize, or throw. */
export async function authorize(feature: FeatureKey | null) {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");
  if (feature) {
    const features = await getFeatures();
    if (!features.has(feature)) throw new NotEntitledError(feature);
  }
  return session;
}
