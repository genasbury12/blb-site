import { createHash } from "node:crypto";
import type Stripe from "stripe";
import { HANDLED_EVENTS, toCommand, type StripeObject } from "@/domain/billing/events";

/**
 * Stripe webhook processing (D05, D07, D09):
 * 1. verify the signature over the raw body (never trust an unsigned payload or a redirect),
 * 2. record the event id (duplicates are acknowledged and skipped),
 * 3. apply one idempotent SQL command,
 * 4. when the sixth installment is collected (or the order is refunded), stop the Stripe subscription,
 * 5. mark the event processed, or leave it unprocessed and return 500 so Stripe retries.
 * Dependencies are injected so the whole path is unit tested.
 */
export type Rpc = (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
export type StopSubscription = (subscriptionId: string) => Promise<void>;

export type WebhookResult = { status: number; body: Record<string, unknown> };

export async function handleStripeWebhook(input: {
  rawBody: string;
  signature: string | null;
  secret: string;
  constructEvent: (body: string, sig: string, secret: string) => Stripe.Event;
  rpc: Rpc;
  stopSubscription: StopSubscription;
  log?: (level: "info" | "warn" | "error", msg: string, data?: Record<string, unknown>) => void;
}): Promise<WebhookResult> {
  const log = input.log ?? (() => undefined);
  if (!input.signature) return { status: 400, body: { error: "missing signature" } };
  let event: Stripe.Event;
  try {
    event = input.constructEvent(input.rawBody, input.signature, input.secret);
  } catch {
    log("warn", "stripe webhook signature rejected");
    return { status: 400, body: { error: "invalid signature" } };
  }
  if (event.livemode && process.env.STRIPE_LIVE_MODE_APPROVAL !== "approved-by-owner") {
    log("error", "live mode event received without owner approval", { type: event.type });
    return { status: 400, body: { error: "live mode not approved" } };
  }
  if (!(HANDLED_EVENTS as readonly string[]).includes(event.type)) {
    return { status: 200, body: { ignored: event.type } };
  }

  const sha = createHash("sha256").update(input.rawBody).digest("hex");
  const rec = await input.rpc("billing_record_event", { p_id: event.id, p_type: event.type, p_created: new Date(event.created * 1000).toISOString(), p_sha: sha });
  if (rec.error) return { status: 500, body: { error: "could not record event" } };
  if (rec.data === false) return { status: 200, body: { duplicate: true } };

  try {
    const cmd = toCommand(event as unknown as { type: string; data: { object: StripeObject } });
    let result: Record<string, unknown> | null = null;
    switch (cmd.kind) {
      case "ignore":
        await input.rpc("billing_mark_event", { p_id: event.id, p_outcome: `ignored: ${cmd.reason}`, p_error: null });
        return { status: 200, body: { ignored: cmd.reason } };
      case "link_payment_intent": {
        const r = await input.rpc("billing_link_payment_intent", { p_invoice: cmd.invoiceId, p_payment_intent: cmd.paymentIntentId });
        if (r.error) throw new Error(r.error.message);
        break;
      }
      default: {
        const fn = {
          checkout: "billing_apply_checkout",
          invoice: "billing_apply_invoice",
          subscription: "billing_apply_subscription",
          refund: "billing_apply_refund",
          dispute: "billing_apply_dispute",
        }[cmd.kind];
        const r = await input.rpc(fn, { p: cmd.payload });
        if (r.error) throw new Error(r.error.message);
        result = (r.data as Record<string, unknown>) ?? null;
      }
    }

    // D05: stop billing after the sixth successful collection; also stop after a full refund.
    if (result?.stop_schedule && typeof result.stripe_subscription_id === "string") {
      await input.stopSubscription(result.stripe_subscription_id);
      log("info", "installment schedule stopped", { order: result.order_id, reason: result.status });
    }

    await input.rpc("billing_mark_event", { p_id: event.id, p_outcome: result?.status ? String(result.status) : "ok", p_error: null });
    return { status: 200, body: { received: true } };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("error", "stripe webhook processing failed", { type: event.type, error: message });
    await input.rpc("billing_mark_event", { p_id: event.id, p_outcome: "error", p_error: message });
    return { status: 500, body: { error: "processing failed" } };
  }
}

/** Cancel an installment subscription after the sixth payment. Already canceled is fine. */
export function stripeStopper(stripe: Stripe): StopSubscription {
  return async (subscriptionId) => {
    try {
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      if (sub.status === "canceled") return;
      await stripe.subscriptions.cancel(subscriptionId, { invoice_now: false, prorate: false });
    } catch (err) {
      if ((err as { code?: string }).code === "resource_missing") return;
      throw err;
    }
  };
}
