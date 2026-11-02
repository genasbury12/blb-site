import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { publicEnv } from "@/lib/env";

/**
 * Supabase client acting as the signed in user. Every query runs under RLS with the user's JWT.
 * Returns null when Supabase is not configured for this environment.
 */
export async function createSupabaseServerClient() {
  // Mark every caller as request time (never prerendered), with or without config. connection() is needed in
  // addition to cookies(): with cacheComponents, the Auth client reads the clock (Date.now()) while loading the
  // session, which Next.js rejects after runtime data alone ("blocking-prerender-current-time").
  await connection();
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
