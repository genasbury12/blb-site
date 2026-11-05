import "server-only";
import Stripe from "stripe";
import { assertStripeKeyAllowed } from "@/lib/env";
import { IntegrationNotConfigured } from "./integrations";

/** Stripe client. Refuses live keys unless the owner has approved live billing (D05, D18). */
let client: Stripe | null = null;
export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new IntegrationNotConfigured("stripe");
  if (!client) {
    client = new Stripe(assertStripeKeyAllowed(process.env.STRIPE_SECRET_KEY, process.env.STRIPE_LIVE_MODE_APPROVAL), {
      appInfo: { name: "The BOSS Business System" },
      maxNetworkRetries: 2,
      // Behind an outbound proxy (test containers), use fetch, which honors it; Vercel has none and keeps the default.
      ...(process.env.HTTPS_PROXY ? { httpClient: Stripe.createFetchHttpClient() } : {}),
    });
  }
  return client;
}

export function webhookSecret(): string {
  const s = process.env.STRIPE_WEBHOOK_SECRET;
  if (!s) throw new IntegrationNotConfigured("stripe");
  return s;
}
