import "server-only";

/** Thrown when an external service has no credentials in this environment. Pages show an honest state. */
export class IntegrationNotConfigured extends Error {
  constructor(readonly service: "supabase-service-role" | "stripe" | "mux" | "resend") {
    super(`${service} is not configured in this environment`);
    this.name = "IntegrationNotConfigured";
  }
}

export function integrationStatus() {
  return {
    supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    stripe: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
    mux: Boolean(process.env.MUX_SIGNING_KEY_ID && process.env.MUX_SIGNING_PRIVATE_KEY),
    resend: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
    sentry: Boolean(process.env.SENTRY_DSN),
  };
}
