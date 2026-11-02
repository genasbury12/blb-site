/**
 * Maps a verified Stripe event to one billing command. Pure and defensive: unknown shapes return
 * "ignore" or "exception" rather than guessing. Written against Stripe API version 2026-10-28, where an
 * invoice's subscription is under parent.subscription_details and periods are on subscription items.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw Stripe webhook JSON: every field is checked before use
type Obj = Record<string, any>;
export type StripeObject = Obj;
export type BillingCommand =
  | { kind: "checkout"; payload: Obj }
  | { kind: "invoice"; payload: Obj }
  | { kind: "link_payment_intent"; invoiceId: string; paymentIntentId: string }
  | { kind: "subscription"; payload: Obj }
  | { kind: "refund"; payload: Obj }
  | { kind: "dispute"; payload: Obj }
  | { kind: "ignore"; reason: string };

const iso = (unix: unknown) => (typeof unix === "number" ? new Date(unix * 1000).toISOString() : null);
const id = (v: unknown) => (typeof v === "string" ? v : v && typeof v === "object" && typeof (v as Obj).id === "string" ? (v as Obj).id : null);

export const HANDLED_EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.expired",
  "invoice.paid",
  "invoice.payment_failed",
  "invoice_payment.paid",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "charge.refunded",
  "charge.dispute.created",
  "charge.dispute.updated",
  "charge.dispute.closed",
] as const;

export function invoiceSubscriptionId(inv: Obj): string | null {
  return id(inv?.parent?.subscription_details?.subscription) ?? id(inv?.subscription);
}

export function toCommand(event: { type: string; data: { object: Obj } }): BillingCommand {
  const o = event.data.object;
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
    case "checkout.session.expired": {
      const md = o.metadata ?? {};
      if (!md.sku || !md.plan || !md.user_id) return { kind: "ignore", reason: "checkout session without BOSS metadata" };
      if (md.plan === "monthly") return { kind: "ignore", reason: "subscription checkout: handled by subscription events" };
      return {
        kind: "checkout",
        payload: {
          session_id: o.id,
          user_id: md.user_id,
          sku: md.sku,
          plan: md.plan,
          email: o.customer_details?.email ?? null,
          customer_id: id(o.customer),
          payment_intent_id: id(o.payment_intent),
          subscription_id: id(o.subscription),
          payment_status: o.payment_status,
          session_status: o.status,
          amount_cents: o.amount_total ?? null,
          paid_at: iso(o.created),
        },
      };
    }
    case "invoice.paid":
    case "invoice.payment_failed": {
      const sub = invoiceSubscriptionId(o);
      if (!sub) return { kind: "ignore", reason: "invoice without subscription" };
      const paid = event.type === "invoice.paid";
      return {
        kind: "invoice",
        payload: {
          invoice_id: o.id,
          subscription_id: sub,
          amount_cents: paid ? (o.amount_paid ?? o.total ?? 0) : (o.amount_due ?? o.total ?? 0),
          state: paid ? "paid" : "failed",
          due_at: iso(o.due_date) ?? iso(o.period_end) ?? iso(o.created),
          paid_at: paid ? iso(o.status_transitions?.paid_at) ?? iso(o.created) : null,
        },
      };
    }
    case "invoice_payment.paid": {
      const invoiceId = id(o.invoice);
      const pi = id(o.payment?.payment_intent);
      if (!invoiceId || !pi) return { kind: "ignore", reason: "invoice payment without payment intent" };
      return { kind: "link_payment_intent", invoiceId, paymentIntentId: pi };
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const md = o.metadata ?? {};
      const item = o.items?.data?.[0] ?? {};
      return {
        kind: "subscription",
        payload: {
          stripe_subscription_id: o.id,
          user_id: md.user_id ?? null,
          sku: md.sku ?? null,
          status: event.type === "customer.subscription.deleted" ? "canceled" : o.status,
          current_period_start: iso(item.current_period_start) ?? iso(o.start_date),
          current_period_end: iso(item.current_period_end) ?? iso(o.ended_at) ?? iso(o.cancel_at),
          cancel_at_period_end: Boolean(o.cancel_at_period_end),
          canceled_at: iso(o.canceled_at),
        },
      };
    }
    case "charge.refunded":
      return {
        kind: "refund",
        payload: { payment_intent_id: id(o.payment_intent), charge_id: o.id, amount: o.amount, amount_refunded: o.amount_refunded },
      };
    case "charge.dispute.created":
    case "charge.dispute.updated":
    case "charge.dispute.closed":
      return {
        kind: "dispute",
        payload: { payment_intent_id: id(o.payment_intent), dispute_id: o.id, dispute_status: o.status, amount: o.amount },
      };
    default:
      return { kind: "ignore", reason: `unhandled event ${event.type}` };
  }
}
