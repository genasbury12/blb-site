import { z } from "zod";

/**
 * Environment access with validation (Zod at the trust boundary).
 * Missing integrations are allowed in local/test so the app can run with mocks;
 * staging/production assert required values at use time via the require* helpers.
 */

const appEnvSchema = z.enum(["local", "test", "staging", "production"]);
export type AppEnv = z.infer<typeof appEnvSchema>;

export function appEnv(): AppEnv {
  const parsed = appEnvSchema.safeParse(process.env.APP_ENV ?? "local");
  return parsed.success ? parsed.data : "local";
}

const optionalString = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .optional();

const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: optionalString,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalString,
});

export type PublicEnv = z.infer<typeof publicSchema>;

export function publicEnv(): PublicEnv {
  return publicSchema.parse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

/** True when Supabase Auth is configured for this environment. */
export function isSupabaseConfigured(): boolean {
  const env = publicEnv();
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export const FEATURE_FLAGS = [
  "billing",
  "coaching",
  "community",
  "feedback",
  "elite",
  "marketing_pages",
] as const;
export type FeatureFlag = (typeof FEATURE_FLAGS)[number];

/**
 * Deployment level feature flags. They hide incomplete or unapproved functionality.
 * A flag never grants access: entitlement checks still run on the server and in RLS.
 */
export function isFeatureEnabled(flag: FeatureFlag, source: NodeJS.ProcessEnv = process.env): boolean {
  return source[`FEATURE_${flag.toUpperCase()}`] === "true";
}

export const STRIPE_LIVE_APPROVAL_TOKEN = "approved-by-owner";

/**
 * Guard against live charging without explicit owner approval (D05, D18).
 * Returns the key only if it is a test key, or a live key with the approval token set.
 */
export function assertStripeKeyAllowed(
  key: string | undefined,
  approval: string | undefined,
): string {
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured.");
  if (key.startsWith("sk_test_") || key.startsWith("rk_test_")) return key;
  if ((key.startsWith("sk_live_") || key.startsWith("rk_live_")) && approval === STRIPE_LIVE_APPROVAL_TOKEN) {
    return key;
  }
  throw new Error(
    "Refusing to use a live Stripe key: live billing requires explicit owner approval (STRIPE_LIVE_MODE_APPROVAL).",
  );
}

/**
 * Email recipients outside production must be on the allowlist (D16).
 */
export function isEmailRecipientAllowed(
  to: string,
  env: { appEnv: AppEnv; sendingEnabled: boolean; allowlist: string | undefined },
): boolean {
  if (!env.sendingEnabled) return false;
  if (env.appEnv === "production") return true;
  const allowed = (env.allowlist ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(to.trim().toLowerCase());
}
