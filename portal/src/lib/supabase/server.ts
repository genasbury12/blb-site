import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "@/lib/env";

/**
 * Supabase client acting as the signed in user. Every query runs under RLS with the user's JWT.
 * Returns null when Supabase is not configured for this environment.
 */
export async function createSupabaseServerClient() {
  // Read cookies first so every caller is request time (never prerendered), with or without config.
  const cookieStore = await cookies();
  const env = publicEnv();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component: cookies are refreshed by the proxy instead.
        }
      },
    },
  });
}

export type UserSupabase = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;
