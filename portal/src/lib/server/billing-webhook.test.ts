// @vitest-environment node
import Stripe from "stripe";
import { describe, expect, it, vi } from "vitest";
import { handleStripeWebhook, type Rpc } from "./billing-webhook";

const stripe = new Stripe("sk_test_dummy");
const secret = "whsec_test_secret";

function signed(event: Record<string, unknown>) {
  const body = JSON.stringify(event);
  const signature = stripe.webhooks.generateTestHeaderString({ payload: body, secret });
  return { body, signature };
}

const baseEvent = (type: string, object: Record<string, unknown>, id = "evt_1") => ({ id, object: "event", type, created: 1800000000, livemode: false, data: { object } });

function fakeRpc(results: Record<string, unknown> = {}) {
  const calls: { fn: string; args: Record<string, unknown> }[] = [];
  const rpc: Rpc = async (fn, args) => {
    calls.push({ fn, args });
    if (fn === "billing_record_event") return { data: results.record ?? true, error: null };
    if (fn in results) return { data: results[fn], error: null };
    return { data: { status: "ok" }, error: null };
  };
  return { rpc, calls };
}

const run = (body: string, signature: string | null, rpc: Rpc, stop = vi.fn(async () => undefined)) =>
  handleStripeWebhook({ rawBody: body, signature, secret, constructEvent: (b, s, k) => stripe.webhooks.constructEvent(b, s, k), rpc, stopSubscription: stop });

describe("Stripe webhook handler", () => {
  it("rejects missing and forged signatures", async () => {
    const { body } = signed(baseEvent("invoice.paid", {}));
    const { rpc, calls } = fakeRpc();
    expect((await run(body, null, rpc)).status).toBe(400);
    const forged = stripe.webhooks.generateTestHeaderString({ payload: body, secret: "whsec_wrong" });
    expect((await run(body, forged, rpc)).status).toBe(400);
    const { signature } = signed(baseEvent("invoice.paid", {}));
    expect((await run(body.replace("invoice.paid", "invoice.paid "), signature, rpc)).status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it("refuses live mode events without owner approval", async () => {
    const { body, signature } = signed({ ...baseEvent("invoice.paid", {}), livemode: true });
    const { rpc, calls } = fakeRpc();
    expect((await run(body, signature, rpc)).status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it("acknowledges duplicates without applying them again", async () => {
    const { body, signature } = signed(baseEvent("invoice.paid", { id: "in_1", parent: { subscription_details: { subscription: "sub_1" } } }));
    const { rpc, calls } = fakeRpc({ record: false });
    const r = await run(body, signature, rpc);
    expect(r).toEqual({ status: 200, body: { duplicate: true } });
    expect(calls.map((c) => c.fn)).toEqual(["billing_record_event"]);
  });

  it("applies an invoice and stops the subscription after the sixth payment", async () => {
    const { body, signature } = signed(baseEvent("invoice.paid", { id: "in_6", amount_paid: 29700, created: 1800000000, parent: { subscription_details: { subscription: "sub_9" } } }));
    const { rpc, calls } = fakeRpc({ billing_apply_invoice: { status: "installments_completed", stop_schedule: true, stripe_subscription_id: "sub_9", order_id: "o1" } });
    const stop = vi.fn(async () => undefined);
    const r = await run(body, signature, rpc, stop);
    expect(r.status).toBe(200);
    expect(stop).toHaveBeenCalledWith("sub_9");
    expect(calls.map((c) => c.fn)).toEqual(["billing_record_event", "billing_apply_invoice", "billing_mark_event"]);
    expect(calls[1]!.args).toEqual({ p: expect.objectContaining({ invoice_id: "in_6", subscription_id: "sub_9", state: "paid" }) });
  });

  it("does not stop the subscription before the sixth payment", async () => {
    const { body, signature } = signed(baseEvent("invoice.paid", { id: "in_2", parent: { subscription_details: { subscription: "sub_9" } } }));
    const { rpc } = fakeRpc({ billing_apply_invoice: { status: "installments_current", stop_schedule: false, stripe_subscription_id: "sub_9" } });
    const stop = vi.fn(async () => undefined);
    await run(body, signature, rpc, stop);
    expect(stop).not.toHaveBeenCalled();
  });

  it("returns 500 and records the error so Stripe retries", async () => {
    const { body, signature } = signed(baseEvent("charge.refunded", { id: "ch_1", payment_intent: "pi_1", amount: 1, amount_refunded: 1 }));
    const calls: string[] = [];
    const rpc: Rpc = async (fn) => {
      calls.push(fn);
      if (fn === "billing_record_event") return { data: true, error: null };
      if (fn === "billing_apply_refund") return { data: null, error: { message: "db down" } };
      return { data: null, error: null };
    };
    const r = await run(body, signature, rpc);
    expect(r.status).toBe(500);
    expect(calls).toEqual(["billing_record_event", "billing_apply_refund", "billing_mark_event"]);
  });

  it("ignores events we do not handle without touching the database", async () => {
    const { body, signature } = signed(baseEvent("customer.created", {}));
    const { rpc, calls } = fakeRpc();
    expect((await run(body, signature, rpc)).body).toEqual({ ignored: "customer.created" });
    expect(calls).toHaveLength(0);
  });
});
