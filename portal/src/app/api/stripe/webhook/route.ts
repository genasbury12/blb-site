import { NextResponse } from "next/server";
import { logEvent } from "@/lib/observability";
import { handleStripeWebhook, stripeStopper } from "@/lib/server/billing-webhook";
import { IntegrationNotConfigured } from "@/lib/server/integrations";
import { getStripe, webhookSecret } from "@/lib/server/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** Stripe webhook endpoint. Signature verified over the raw body; service role writes only after verification. */
export async function POST(request: Request) {
  let stripe;
  let secret;
  let admin;
  try {
    stripe = getStripe();
    secret = webhookSecret();
    admin = createSupabaseAdminClient();
  } catch (err) {
    if (err instanceof IntegrationNotConfigured || (err instanceof Error && /not configured/.test(err.message))) {
      return NextResponse.json({ error: "billing not configured" }, { status: 503 });
    }
    throw err;
  }
  const rawBody = await request.text();
  const result = await handleStripeWebhook({
    rawBody,
    signature: request.headers.get("stripe-signature"),
    secret,
    constructEvent: (b, s, k) => stripe.webhooks.constructEvent(b, s, k),
    rpc: async (fn, args) => {
      const r = await admin.rpc(fn, args);
      return { data: r.data, error: r.error ? { message: r.error.message } : null };
    },
    stopSubscription: stripeStopper(stripe),
    log: logEvent,
  });
  return NextResponse.json(result.body, { status: result.status });
}
