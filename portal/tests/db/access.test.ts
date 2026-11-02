import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { addDays, addMonths, asUser, connect, createUser, expectDenied, hasFeature, paidOrder } from "./helpers";

let db: Client;
beforeAll(async () => {
  db = await connect();
});
afterAll(async () => {
  await db.end();
});

const ACTIVATION = new Date("2027-02-15T17:00:00Z");

describe("anonymous visitors", () => {
  it("can read the public catalog and prices only", async () => {
    const prices = await asUser(db, null, (q) => q("select sku, plan, amount_cents from public.prices order by sku, plan"));
    expect(prices.length).toBe(8);
    for (const table of ["profiles", "orders", "entitlements", "lessons", "modules", "audit_runs", "audit_drafts", "lesson_progress", "admin_audit_log"]) {
      const rows = await asUser(db, null, (q) => q(`select * from public.${table}`));
      expect(rows, table).toHaveLength(0);
    }
  });
  it("cannot read billing events or app config at all", async () => {
    await expectDenied(db, null, "select * from public.billing_events");
    await expectDenied(db, null, "select * from public.app_config");
  });
  it("cannot call identity scoped functions", async () => {
    await expectDenied(db, null, "select * from public.my_features()");
  });
});

describe("approved prices (D04)", () => {
  it("match the approved catalog exactly", async () => {
    const { rows } = await db.query("select sku, plan, amount_cents, installment_count from public.prices order by sku, plan");
    expect(rows).toEqual([
      { sku: "accelerator", plan: "pay_in_full", amount_cents: 149700, installment_count: 1 },
      { sku: "accelerator", plan: "six_installments", amount_cents: 29700, installment_count: 6 },
      { sku: "blueprint", plan: "pay_in_full", amount_cents: 49700, installment_count: 1 },
      { sku: "blueprint", plan: "six_installments", amount_cents: 9700, installment_count: 6 },
      { sku: "elite", plan: "pay_in_full", amount_cents: 499700, installment_count: 1 },
      { sku: "elite", plan: "six_installments", amount_cents: 89700, installment_count: 6 },
      { sku: "elite_board", plan: "monthly", amount_cents: 9700, installment_count: 1 },
      { sku: "graduate_coaching", plan: "monthly", amount_cents: 9700, installment_count: 1 },
    ]);
  });
});

describe("tier entitlements and windows (D06)", () => {
  it("Blueprint: curriculum for 12 months, no paid support", async () => {
    const u = await createUser(db, "blueprint");
    await paidOrder(db, u, "blueprint", { firstPaidAt: ACTIVATION });
    expect(await hasFeature(db, u, "curriculum.read", ACTIVATION)).toBe(true);
    expect(await hasFeature(db, u, "audit.use", ACTIVATION)).toBe(true);
    for (const f of ["feedback.submit", "group_coaching.access", "community.access", "elite_board.access", "elite_coaching.access"]) {
      expect(await hasFeature(db, u, f, ACTIVATION), f).toBe(false);
    }
    const end = addMonths(ACTIVATION, 12);
    expect(await hasFeature(db, u, "curriculum.read", new Date(end.getTime() - 1000))).toBe(true);
    expect(await hasFeature(db, u, "curriculum.read", end)).toBe(false);
    expect(await hasFeature(db, u, "curriculum.read", new Date(ACTIVATION.getTime() - 1000))).toBe(false);
  });

  it("Accelerator: coaching, community and feedback for exactly 6 months", async () => {
    const u = await createUser(db, "accelerator");
    await paidOrder(db, u, "accelerator", { firstPaidAt: ACTIVATION });
    const sixMonths = addMonths(ACTIVATION, 6);
    for (const f of ["group_coaching.access", "community.access", "feedback.submit", "workshops.access", "hotseat.apply"]) {
      expect(await hasFeature(db, u, f, new Date(sixMonths.getTime() - 1000)), f).toBe(true);
      expect(await hasFeature(db, u, f, sixMonths), f).toBe(false);
    }
    expect(await hasFeature(db, u, "curriculum.read", sixMonths)).toBe(true);
    expect(await hasFeature(db, u, "elite_board.access", ACTIVATION)).toBe(false);
  });

  it("Elite: private coaching and board 6 months, DFY hours 6 months plus 30 days", async () => {
    const u = await createUser(db, "elite");
    await paidOrder(db, u, "elite", { firstPaidAt: ACTIVATION });
    const six = addMonths(ACTIVATION, 6);
    expect(await hasFeature(db, u, "elite_coaching.access", new Date(six.getTime() - 1000))).toBe(true);
    expect(await hasFeature(db, u, "elite_coaching.access", six)).toBe(false);
    expect(await hasFeature(db, u, "elite_board.access", six)).toBe(false);
    expect(await hasFeature(db, u, "elite_dfu_hours.use", addDays(six, 29))).toBe(true);
    expect(await hasFeature(db, u, "elite_dfu_hours.use", addDays(six, 30))).toBe(false);
  });

  it("Graduate subscription extends curriculum while active, but never feedback or Elite", async () => {
    const u = await createUser(db, "graduate");
    await paidOrder(db, u, "accelerator", { firstPaidAt: ACTIVATION });
    const periodStart = addMonths(ACTIVATION, 12);
    const periodEnd = addMonths(ACTIVATION, 13);
    const { rows } = await db.query<{ id: string }>(
      `insert into public.subscriptions (user_id, sku, status, current_period_start, current_period_end)
       values ($1, 'graduate_coaching', 'active', $2, $3) returning id`,
      [u, periodStart, periodEnd],
    );
    await db.query("select app.sync_subscription_entitlements($1)", [rows[0]!.id]);
    const inside = addDays(periodStart, 10);
    expect(await hasFeature(db, u, "curriculum.read", inside)).toBe(true);
    expect(await hasFeature(db, u, "group_coaching.access", inside)).toBe(true);
    expect(await hasFeature(db, u, "feedback.submit", inside)).toBe(false);
    expect(await hasFeature(db, u, "elite_board.access", inside)).toBe(false);
    expect(await hasFeature(db, u, "curriculum.read", periodEnd)).toBe(false);
  });

  it("Board retention grants the board only, never curriculum", async () => {
    const u = await createUser(db, "boardonly");
    const start = new Date("2027-09-01T00:00:00Z");
    const { rows } = await db.query<{ id: string }>(
      `insert into public.subscriptions (user_id, sku, status, current_period_start, current_period_end)
       values ($1, 'elite_board', 'active', $2, $3) returning id`,
      [u, start, addMonths(start, 1)],
    );
    await db.query("select app.sync_subscription_entitlements($1)", [rows[0]!.id]);
    const t = addDays(start, 3);
    expect(await hasFeature(db, u, "elite_board.access", t)).toBe(true);
    for (const f of ["curriculum.read", "elite_coaching.access", "feedback.submit", "group_coaching.access", "elite_dfu_hours.use"]) {
      expect(await hasFeature(db, u, f, t), f).toBe(false);
    }
  });
});

describe("failed payments, disputes, refunds (D07)", () => {
  it("keeps access for 7 days after the first failed due date, then suspends; cure restores original dates", async () => {
    const u = await createUser(db, "pastdue");
    const failed = addMonths(ACTIVATION, 2);
    const orderId = await paidOrder(db, u, "accelerator", {
      plan: "six_installments",
      firstPaidAt: ACTIVATION,
      status: "installments_past_due",
      pastDueSince: failed,
    });
    expect(await hasFeature(db, u, "curriculum.read", addDays(failed, 6))).toBe(true);
    expect(await hasFeature(db, u, "feedback.submit", new Date(addDays(failed, 7).getTime() - 1000))).toBe(true);
    expect(await hasFeature(db, u, "curriculum.read", addDays(failed, 7))).toBe(false);
    expect(await hasFeature(db, u, "group_coaching.access", addDays(failed, 8))).toBe(false);

    await db.query("update public.orders set status = 'installments_current', past_due_since = null where id = $1", [orderId]);
    expect(await hasFeature(db, u, "curriculum.read", addDays(failed, 8))).toBe(true);
    // Original coaching window is not extended by the suspension.
    expect(await hasFeature(db, u, "group_coaching.access", addMonths(ACTIVATION, 6))).toBe(false);
  });

  it("suspends immediately on dispute", async () => {
    const u = await createUser(db, "disputed");
    const orderId = await paidOrder(db, u, "blueprint", { firstPaidAt: ACTIVATION });
    await db.query("update public.orders set status = 'disputed' where id = $1", [orderId]);
    expect(await hasFeature(db, u, "curriculum.read", addDays(ACTIVATION, 1))).toBe(false);
  });

  it("revokes grants on verified refund without deleting work", async () => {
    const u = await createUser(db, "refund");
    const orderId = await paidOrder(db, u, "blueprint", { firstPaidAt: ACTIVATION });
    await db.query("update public.orders set status = 'refunded' where id = $1", [orderId]);
    const revoked = await db.query("select app.revoke_order_entitlements($1, 'verified refund event') as n", [orderId]);
    expect(revoked.rows[0].n).toBe(4);
    expect(await hasFeature(db, u, "curriculum.read", addDays(ACTIVATION, 1))).toBe(false);
    const { rows } = await db.query("select count(*)::int as n from public.entitlements where source_id = $1", [orderId]);
    expect(rows[0].n).toBe(4);
  });

  it("grants are idempotent under webhook replay", async () => {
    const u = await createUser(db, "replay");
    const orderId = await paidOrder(db, u, "elite", { firstPaidAt: ACTIVATION });
    const again = await db.query("select app.grant_order_entitlements($1) as n", [orderId]);
    expect(again.rows[0].n).toBe(0);
    const { rows } = await db.query("select count(*)::int as n from public.entitlements where user_id = $1", [u]);
    expect(rows[0].n).toBe(12);
  });

  it("refuses to grant for unpaid or unlinked orders", async () => {
    const u = await createUser(db, "unpaid");
    await expect(paidOrder(db, u, "blueprint", { status: "pending" })).rejects.toThrow(/not in a paid state/);
  });
});

describe("no self promotion or forged grants (D09)", () => {
  it("students cannot write roles, entitlements, orders or audit logs", async () => {
    const u = await createUser(db, "attacker");
    await expectDenied(db, u, "insert into public.user_roles (user_id, role) values ($1, 'admin')", [u]);
    await expectDenied(
      db,
      u,
      "insert into public.entitlements (user_id, feature_key, source_type, starts_at, manual_override_reason) values ($1, 'curriculum.read', 'admin_override', now(), 'please let me in')",
      [u],
    );
    await expectDenied(db, u, "insert into public.orders (user_id, sku, price_id, payment_plan, amount_cents) select $1, sku, id, plan, 1 from public.prices limit 1", [u]);
    await expectDenied(db, u, "insert into public.admin_audit_log (action, entity_type) values ('fake', 'x')");
    await expectDenied(db, u, "select app.grant_order_entitlements(gen_random_uuid())");
    await expectDenied(db, u, "select app.log_admin_action('x.y', 'x', null)");
    await expectDenied(db, u, "select public.admin_grant_entitlement($1, 'curriculum.read', now(), null, 'self grant attempt')", [u]);
  });

  it("students cannot change server managed profile state", async () => {
    const u = await createUser(db, "profile");
    await expectDenied(db, u, "update public.profiles set onboarding_state = 'audit_completed' where user_id = $1", [u]);
    const rows = await asUser(db, u, (q) => q("update public.profiles set display_name = 'New Name' where user_id = $1 returning display_name", [u]));
    expect(rows).toEqual([{ display_name: "New Name" }]);
  });

  it("admins can grant with a reason, and the action is audited", async () => {
    const admin = await createUser(db, "admin");
    await db.query("insert into public.user_roles (user_id, role) values ($1, 'admin')", [admin]);
    const student = await createUser(db, "comped");
    await expectDenied(db, admin, "select public.admin_grant_entitlement($1, 'curriculum.read', now(), null, 'no')", [student]);
    await db.query("begin");
    await db.query("set local role authenticated");
    await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: admin, role: "authenticated" })]);
    await db.query("select public.admin_grant_entitlement($1, 'curriculum.read', now(), null, 'Comp for QA review')", [student]);
    await db.query("commit");
    expect(await hasFeature(db, student, "curriculum.read")).toBe(true);
    const { rows } = await db.query("select action, reason, actor_id from public.admin_audit_log where changed_fields->>'user_id' = $1", [student]);
    expect(rows).toEqual([{ action: "entitlement.grant", reason: "Comp for QA review", actor_id: admin }]);
    await expect(db.query("delete from public.admin_audit_log")).rejects.toThrow(/append only/);
  });
});

describe("coach role management", () => {
  it("only admins grant the coach role, with a reason, and it is audited; nobody can grant admin through the API", async () => {
    const admin = await createUser(db, "roleadmin");
    await db.query("insert into public.user_roles (user_id, role) values ($1, 'admin')", [admin]);
    const target = await createUser(db, "futurecoach");
    await expectDenied(db, target, "select public.admin_set_coach_role($1, true, 'promote myself')", [target]);
    await db.query("begin");
    await db.query("set local role authenticated");
    await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: admin, role: "authenticated" })]);
    await db.query("select public.admin_set_coach_role($1, true, 'Hired as a coach')", [target]);
    await db.query("commit");
    const roles = await db.query("select role from public.user_roles where user_id = $1", [target]);
    expect(roles.rows).toEqual([{ role: "coach" }]);
    const log = await db.query("select action from public.admin_audit_log where entity_id = $1", [target]);
    expect(log.rows).toEqual([{ action: "role.coach.grant" }]);
    await expectDenied(db, admin, "insert into public.user_roles (user_id, role) values ($1, 'admin')", [target]);
  });
});
