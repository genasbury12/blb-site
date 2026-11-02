import { describe, expect, it } from "vitest";
import { toCommand } from "./events";

const ev = (type: string, object: Record<string, unknown>) => ({ type, data: { object } });

describe("Stripe event mapping (API 2026-10-28 shapes)", () => {
  it("maps a paid pay in full checkout", () => {
    const c = toCommand(ev("checkout.session.completed", {
      id: "cs_1", status: "complete", payment_status: "paid", customer: "cus_1", payment_intent: "pi_1", subscription: null, amount_total: 49700, created: 1800000000,
      metadata: { user_id: "u1", sku: "blueprint", plan: "pay_in_full" }, customer_details: { email: "a@b.co" },
    }));
    expect(c).toEqual({ kind: "checkout", payload: expect.objectContaining({ session_id: "cs_1", user_id: "u1", payment_intent_id: "pi_1", payment_status: "paid", amount_cents: 49700 }) });
  });
  it("ignores sessions without our metadata, and subscription checkouts", () => {
    expect(toCommand(ev("checkout.session.completed", { id: "cs", metadata: {} })).kind).toBe("ignore");
    expect(toCommand(ev("checkout.session.completed", { id: "cs", metadata: { user_id: "u", sku: "graduate_coaching", plan: "monthly" } })).kind).toBe("ignore");
  });
  it("reads the subscription from invoice.parent", () => {
    const c = toCommand(ev("invoice.paid", { id: "in_1", amount_paid: 29700, created: 1800000000, status_transitions: { paid_at: 1800000100 }, parent: { subscription_details: { subscription: "sub_1" } } }));
    expect(c).toEqual({ kind: "invoice", payload: { invoice_id: "in_1", subscription_id: "sub_1", amount_cents: 29700, state: "paid", due_at: "2027-01-15T08:00:00.000Z", paid_at: "2027-01-15T08:01:40.000Z" } });
    const f = toCommand(ev("invoice.payment_failed", { id: "in_2", amount_due: 29700, due_date: 1800000000, parent: { subscription_details: { subscription: { id: "sub_1" } } } }));
    expect(f).toMatchObject({ kind: "invoice", payload: { state: "failed", subscription_id: "sub_1", paid_at: null } });
  });
  it("links invoice payments to payment intents", () => {
    expect(toCommand(ev("invoice_payment.paid", { invoice: "in_1", payment: { type: "payment_intent", payment_intent: "pi_9" } }))).toEqual({ kind: "link_payment_intent", invoiceId: "in_1", paymentIntentId: "pi_9" });
  });
  it("takes subscription periods from the first item and marks deletion as canceled", () => {
    const c = toCommand(ev("customer.subscription.deleted", {
      id: "sub_g", status: "canceled", cancel_at_period_end: false, canceled_at: 1800000000,
      metadata: { user_id: "u1", sku: "graduate_coaching", plan: "monthly" }, items: { data: [{ current_period_start: 1800000000, current_period_end: 1802592000 }] },
    }));
    expect(c).toMatchObject({ kind: "subscription", payload: { status: "canceled", sku: "graduate_coaching", current_period_end: "2027-02-14T08:00:00.000Z" } });
  });
  it("maps refunds and disputes by payment intent", () => {
    expect(toCommand(ev("charge.refunded", { id: "ch_1", payment_intent: "pi_1", amount: 49700, amount_refunded: 49700 }))).toEqual({ kind: "refund", payload: { payment_intent_id: "pi_1", charge_id: "ch_1", amount: 49700, amount_refunded: 49700 } });
    expect(toCommand(ev("charge.dispute.closed", { id: "dp_1", payment_intent: "pi_1", status: "won", amount: 1 }))).toMatchObject({ kind: "dispute", payload: { dispute_status: "won" } });
  });
  it("ignores everything else", () => {
    expect(toCommand(ev("customer.created", {})).kind).toBe("ignore");
  });
});
