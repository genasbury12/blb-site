import { randomUUID } from "node:crypto";
import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { addDays, addMonths, connect, createUser, expectDenied, hasFeature } from "./helpers";

let db: Client;
beforeAll(async () => {
  db = await connect();
});
afterAll(async () => {
  await db.end();
});

/** Call a billing function exactly as the webhook handler does (service role). */
async function svc<T = Record<string, unknown>>(fn: string, ...args: unknown[]): Promise<T> {
  await db.query("begin");
  await db.query("set local role service_role");
  try {
    const placeholders = args.map((_, i) => `$${i + 1}`).join(", ");
    const { rows } = await db.query(`select public.${fn}(${placeholders}) as r`, args);
    await db.query("commit");
    return rows[0].r as T;
  } catch (e) {
    await db.query("rollback");
    throw e;
  }
}

const T0 = new Date("2027-03-15T16:00:00Z");
const checkout = (user: string, sku: string, plan: string, extra: Record<string, unknown> = {}) => ({
  session_id: `cs_test_${randomUUID()}`, user_id: user, email: "x@test.invalid", sku, plan, customer_id: `cus_${user.slice(0, 8)}`, ...extra,
});
const invoice = (sub: string, n: number, state: "paid" | "failed", at: Date) => ({
  invoice_id: `in_${sub}_${n}`, subscription_id: sub, amount_cents: 29700, state, due_at: at.toISOString(), paid_at: state === "paid" ? at.toISOString() : null,
});

describe("event ledger", () => {
  it("records each Stripe event once and allows retry after a failure", async () => {
    const id = `evt_${randomUUID()}`;
    expect(await svc("billing_record_event", id, "invoice.paid", T0, "abc")).toBe(true);
    expect(await svc("billing_record_event", id, "invoice.paid", T0, "abc")).toBe(true); // not yet marked processed
    await svc("billing_mark_event", id, "ok", null);
    expect(await svc("billing_record_event", id, "invoice.paid", T0, "abc")).toBe(false);
  });
  it("students cannot call billing functions", async () => {
    const u = await createUser(db, "billingattacker");
    await expectDenied(db, u, "select public.billing_apply_checkout($1)", [checkout(u, "elite", "pay_in_full", { payment_status: "paid", payment_intent_id: "pi_x" })]);
    await expectDenied(db, u, "select public.billing_apply_invoice($1)", [invoice("sub_x", 1, "paid", T0)]);
  });
});

describe("pay in full", () => {
  it("grants access only once the session is paid, and refund revokes", async () => {
    const u = await createUser(db, "pif");
    const pending = checkout(u, "blueprint", "pay_in_full");
    await svc("billing_apply_checkout", { ...pending, payment_status: "unpaid" });
    expect(await hasFeature(db, u, "curriculum.read")).toBe(false);
    const pi = `pi_${randomUUID()}`;
    const r = await svc<{ status: string }>("billing_apply_checkout", { ...pending, payment_status: "paid", payment_intent_id: pi, amount_cents: 49700 });
    expect(r.status).toBe("paid");
    expect(await hasFeature(db, u, "curriculum.read")).toBe(true);
    // replay is harmless
    await svc("billing_apply_checkout", { ...pending, payment_status: "paid", payment_intent_id: pi, amount_cents: 49700 });
    const grants = await db.query("select count(*)::int n from public.entitlements where user_id = $1", [u]);
    expect(grants.rows[0].n).toBe(4);

    await svc("billing_apply_refund", { payment_intent_id: pi, amount_refunded: 49700, charge_id: "ch_1" });
    expect(await hasFeature(db, u, "curriculum.read")).toBe(false);
  });

  it("a partial refund does not revoke and is flagged for review", async () => {
    const u = await createUser(db, "partial");
    const pi = `pi_${randomUUID()}`;
    const r = await svc<{ order_id: string }>("billing_apply_checkout", { ...checkout(u, "blueprint", "pay_in_full"), payment_status: "paid", payment_intent_id: pi, amount_cents: 49700 });
    await svc("billing_apply_refund", { payment_intent_id: pi, amount_refunded: 10000, charge_id: "ch_2" });
    expect(await hasFeature(db, u, "curriculum.read")).toBe(true);
    const ex = await db.query("select kind from public.billing_exceptions where order_id = $1", [r.order_id]);
    expect(ex.rows.map((x) => x.kind)).toContain("partial_refund_review");
  });

  it("a dispute suspends immediately; winning restores; losing revokes", async () => {
    const u = await createUser(db, "dispute");
    const pi = `pi_${randomUUID()}`;
    await svc("billing_apply_checkout", { ...checkout(u, "accelerator", "pay_in_full"), payment_status: "paid", payment_intent_id: pi, amount_cents: 149700 });
    await svc("billing_apply_dispute", { payment_intent_id: pi, dispute_id: "dp_1", dispute_status: "needs_response" });
    expect(await hasFeature(db, u, "curriculum.read")).toBe(false);
    await svc("billing_apply_dispute", { payment_intent_id: pi, dispute_id: "dp_1", dispute_status: "won" });
    expect(await hasFeature(db, u, "group_coaching.access")).toBe(true);
    await svc("billing_apply_dispute", { payment_intent_id: pi, dispute_id: "dp_2", dispute_status: "needs_response" });
    await svc("billing_apply_dispute", { payment_intent_id: pi, dispute_id: "dp_2", dispute_status: "lost" });
    expect(await hasFeature(db, u, "curriculum.read")).toBe(false);
  });
});

describe("six payment plan (D05)", () => {
  it("handles an invoice that arrives before checkout completion", async () => {
    const u = await createUser(db, "ooo");
    const sub = `sub_${randomUUID()}`;
    const first = await svc<{ pending_link?: boolean }>("billing_apply_invoice", invoice(sub, 1, "paid", T0));
    expect(first.pending_link).toBe(true);
    const r = await svc<{ status: string; paid_count: number }>("billing_apply_checkout", { ...checkout(u, "accelerator", "six_installments"), subscription_id: sub, payment_status: "paid" });
    expect(r).toMatchObject({ status: "installments_current", paid_count: 1 });
    expect(await hasFeature(db, u, "feedback.submit", addDays(T0, 1))).toBe(true);
  });

  // Found on staging 2026-11-02: Stripe delivered checkout.session.completed and invoice.paid in the same second;
  // processed in parallel, neither transaction saw the other's row, so the first installment was never linked.
  for (const first of ["invoice", "checkout"] as const) {
    it(`links the first installment when checkout and invoice are processed concurrently (${first} starts first)`, async () => {
      const u = await createUser(db, "race");
      const sub = `sub_${randomUUID()}`;
      const calls = {
        invoice: ["billing_apply_invoice", invoice(sub, 1, "paid", T0)],
        checkout: ["billing_apply_checkout", { ...checkout(u, "blueprint", "six_installments"), subscription_id: sub, payment_status: "paid" }],
      } as const;
      const second = first === "invoice" ? "checkout" : "invoice";
      const a = await connect();
      const b = await connect();
      try {
        for (const c of [a, b]) {
          await c.query("begin");
          await c.query("set local role service_role");
        }
        await a.query(`select public.${calls[first][0]}($1)`, [calls[first][1]]);
        const pending = b.query(`select public.${calls[second][0]}($1)`, [calls[second][1]]);
        await new Promise((r) => setTimeout(r, 300));
        await a.query("commit");
        await pending;
        await b.query("commit");
      } finally {
        await a.end();
        await b.end();
      }
      const { rows } = await db.query(
        "select o.installments_paid, o.status, (select count(*)::int from public.order_payments p where p.stripe_subscription_id = $1 and p.order_id is null) as unlinked from public.orders o where o.stripe_subscription_id = $1",
        [sub],
      );
      expect(rows[0]).toMatchObject({ installments_paid: 1, status: "installments_current", unlinked: 0 });
      expect(await hasFeature(db, u, "curriculum.read", addDays(T0, 1))).toBe(true);
    });
  }

  it("counts six distinct paid invoices, ignores duplicates, and asks to stop billing after the sixth", async () => {
    const u = await createUser(db, "six");
    const sub = `sub_${randomUUID()}`;
    await svc("billing_apply_checkout", { ...checkout(u, "blueprint", "six_installments"), subscription_id: sub, payment_status: "paid" });
    let last: { paid_count: number; status: string; stop_schedule: boolean } | null = null;
    for (let n = 1; n <= 6; n++) {
      last = await svc("billing_apply_invoice", invoice(sub, n, "paid", addMonths(T0, n - 1)));
      if (n === 3) await svc("billing_apply_invoice", invoice(sub, 3, "paid", addMonths(T0, 2))); // duplicate delivery
      if (n < 6) expect(last!.stop_schedule).toBe(false);
    }
    expect(last).toMatchObject({ paid_count: 6, status: "installments_completed", stop_schedule: true });
    const o = await db.query("select installments_paid, first_paid_at from public.orders where stripe_subscription_id = $1", [sub]);
    expect(o.rows[0].installments_paid).toBe(6);
    expect(new Date(o.rows[0].first_paid_at).toISOString()).toBe(T0.toISOString());
    // Curriculum still runs 12 months from the first payment, independent of the billing schedule.
    expect(await hasFeature(db, u, "curriculum.read", addMonths(T0, 11))).toBe(true);
    expect(await hasFeature(db, u, "curriculum.read", addMonths(T0, 12))).toBe(false);
  });

  it("flags an unexpected seventh collection", async () => {
    const u = await createUser(db, "seven");
    const sub = `sub_${randomUUID()}`;
    const r0 = await svc<{ order_id: string }>("billing_apply_checkout", { ...checkout(u, "blueprint", "six_installments"), subscription_id: sub, payment_status: "paid" });
    for (let n = 1; n <= 7; n++) await svc("billing_apply_invoice", invoice(sub, n, "paid", addMonths(T0, n - 1)));
    const ex = await db.query("select kind from public.billing_exceptions where order_id = $1", [r0.order_id]);
    expect(ex.rows.map((x) => x.kind)).toContain("extra_installment_collected");
  });

  it("a failed installment starts 7 day grace; paying it later cures without resetting dates", async () => {
    const u = await createUser(db, "grace");
    const sub = `sub_${randomUUID()}`;
    await svc("billing_apply_checkout", { ...checkout(u, "accelerator", "six_installments"), subscription_id: sub, payment_status: "paid" });
    await svc("billing_apply_invoice", invoice(sub, 1, "paid", T0));
    const due2 = addMonths(T0, 1);
    const r = await svc<{ status: string }>("billing_apply_invoice", invoice(sub, 2, "failed", due2));
    expect(r.status).toBe("installments_past_due");
    expect(await hasFeature(db, u, "group_coaching.access", addDays(due2, 6))).toBe(true);
    expect(await hasFeature(db, u, "group_coaching.access", addDays(due2, 7))).toBe(false);
    // A late "failed" redelivery after payment must not undo the cure.
    await svc("billing_apply_invoice", invoice(sub, 2, "paid", addDays(due2, 9)));
    await svc("billing_apply_invoice", invoice(sub, 2, "failed", due2));
    expect(await hasFeature(db, u, "group_coaching.access", addDays(due2, 10))).toBe(true);
    expect(await hasFeature(db, u, "group_coaching.access", addMonths(T0, 6))).toBe(false);
  });

  it("refunding every installment paid so far revokes; refunding one is a review item", async () => {
    const u = await createUser(db, "instrefund");
    const sub = `sub_${randomUUID()}`;
    await svc("billing_apply_checkout", { ...checkout(u, "blueprint", "six_installments"), subscription_id: sub, payment_status: "paid" });
    await svc("billing_apply_invoice", { ...invoice(sub, 1, "paid", T0), amount_cents: 9700 });
    await svc("billing_link_payment_intent", `in_${sub}_1`, `pi_${sub}_1`);
    await svc("billing_apply_invoice", { ...invoice(sub, 2, "paid", addMonths(T0, 1)), amount_cents: 9700 });
    await svc("billing_link_payment_intent", `in_${sub}_2`, `pi_${sub}_2`);
    const partial = await svc<{ partial?: boolean }>("billing_apply_refund", { payment_intent_id: `pi_${sub}_2`, amount_refunded: 9700, charge_id: "ch" });
    expect(partial.partial).toBe(true);
    expect(await hasFeature(db, u, "curriculum.read", addMonths(T0, 1))).toBe(true);
    const full = await svc<{ status: string; stop_schedule: boolean }>("billing_apply_refund", { payment_intent_id: `pi_${sub}_1`, amount_refunded: 9700, charge_id: "ch" });
    expect(full).toMatchObject({ status: "refunded", stop_schedule: true });
    expect(await hasFeature(db, u, "curriculum.read", addMonths(T0, 1))).toBe(false);
  });
});

describe("graduate and board subscriptions", () => {
  const subEvent = (user: string, sku: string, status: string, start: Date, end: Date, extra: Record<string, unknown> = {}) => ({
    stripe_subscription_id: `sub_${user.slice(0, 8)}_${sku}`, user_id: user, sku, status,
    current_period_start: start.toISOString(), current_period_end: end.toISOString(), cancel_at_period_end: false, ...extra,
  });

  it("graduate grants coaching and curriculum through each paid period; cancellation ends at period end", async () => {
    const u = await createUser(db, "grad");
    const start = new Date("2027-09-15T16:00:00Z");
    await svc("billing_apply_subscription", subEvent(u, "graduate_coaching", "active", start, addMonths(start, 1)));
    expect(await hasFeature(db, u, "group_coaching.access", addDays(start, 5))).toBe(true);
    expect(await hasFeature(db, u, "feedback.submit", addDays(start, 5))).toBe(false);
    await svc("billing_apply_subscription", subEvent(u, "graduate_coaching", "active", addMonths(start, 1), addMonths(start, 2)));
    expect(await hasFeature(db, u, "curriculum.read", addDays(addMonths(start, 1), 5))).toBe(true);
    await svc("billing_apply_subscription", subEvent(u, "graduate_coaching", "active", addMonths(start, 1), addMonths(start, 2), { cancel_at_period_end: true }));
    expect(await hasFeature(db, u, "curriculum.read", addDays(addMonths(start, 2), -1))).toBe(true);
    expect(await hasFeature(db, u, "curriculum.read", addMonths(start, 2))).toBe(false);
  });

  it("a trialing graduate plan (billing starts when coaching ends) keeps access", async () => {
    const u = await createUser(db, "trial");
    const start = new Date("2027-09-15T16:00:00Z");
    await svc("billing_apply_subscription", subEvent(u, "graduate_coaching", "trialing", start, addMonths(start, 1)));
    expect(await hasFeature(db, u, "community.access", addDays(start, 1))).toBe(true);
  });

  // I-55 (owner decision 2026-11-03): board plan = board + training (new lessons) + workshops; no coaching or DFY.
  it("the Elite board plan grants the board, training and workshops, and nothing else, for the paid period", async () => {
    const u = await createUser(db, "boardplan");
    const start = new Date("2027-11-01T16:00:00Z");
    await svc("billing_apply_subscription", subEvent(u, "elite_board", "active", start, addMonths(start, 1)));
    for (const f of ["elite_board.access", "curriculum.read", "workshops.access"]) expect(await hasFeature(db, u, f, addDays(start, 5))).toBe(true);
    for (const f of ["elite_coaching.access", "elite_dfu_hours.use", "group_coaching.access", "community.access", "feedback.submit", "hotseat.apply"]) {
      expect(await hasFeature(db, u, f, addDays(start, 5))).toBe(false);
    }
    expect(await hasFeature(db, u, "curriculum.read", addMonths(start, 1))).toBe(false);
  });

  it("a failed renewal gets 7 days of grace", async () => {
    const u = await createUser(db, "subgrace");
    const start = new Date("2027-10-01T16:00:00Z");
    const ev = subEvent(u, "elite_board", "active", start, addMonths(start, 1));
    await svc("billing_apply_subscription", ev);
    await svc("billing_apply_invoice", { invoice_id: `in_${ev.stripe_subscription_id}_r`, subscription_id: ev.stripe_subscription_id, amount_cents: 9700, state: "failed", due_at: addDays(start, 2).toISOString() });
    expect(await hasFeature(db, u, "elite_board.access", addDays(start, 8))).toBe(true);
    expect(await hasFeature(db, u, "elite_board.access", addDays(start, 9))).toBe(false);
  });
});
