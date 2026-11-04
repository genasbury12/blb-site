import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, connect, createUser, paidOrder } from "./helpers";

/** 10_DATA_RIGHTS Slice C: when access ended, what the daily job sees, and the purchase record purge. */
let db: Client;
let active: string;
let ended: string;
let refunded: string;
let staff: string;
let never: string;
let admin: string;

beforeAll(async () => {
  db = await connect();
  [active, ended, refunded, staff, never, admin] = (await Promise.all(["ret-active", "ret-ended", "ret-refunded", "ret-staff", "ret-never", "ret-admin"].map((l) => createUser(db, l)))) as [string, string, string, string, string, string];
  await paidOrder(db, active, "blueprint");
  await paidOrder(db, ended, "blueprint");
  await paidOrder(db, refunded, "blueprint");
  await paidOrder(db, staff, "blueprint");
  // Ended: the grant window closed on 2025-03-01.
  await db.query("update public.entitlements set starts_at = '2024-03-01', ends_at = '2025-03-01' where user_id = $1", [ended]);
  await db.query("update public.entitlements set starts_at = '2024-03-01', ends_at = '2025-03-01' where user_id = $1", [staff]);
  await db.query("insert into public.user_roles (user_id, role) values ($1, 'coach'), ($2, 'admin')", [staff, admin]);
  // Refunded: the order was refunded at a known time (its grants stop counting then).
  // Triggers stamp updated_at with now(); pause them to place the refund in the past.
  await db.query("set session_replication_role = replica");
  await db.query("update public.orders set status = 'refunded', updated_at = '2025-06-10T10:00:00Z' where user_id = $1", [refunded]);
  await db.query("update public.entitlements set updated_at = '2025-06-10T10:00:00Z' where user_id = $1", [refunded]);
  await db.query("set session_replication_role = origin");
});
afterAll(async () => {
  await db.end();
});

const endedAt = async (u: string) => (await db.query("select app.access_ended_at($1) as t", [u])).rows[0].t as Date | null;

describe("when access ended", () => {
  it("is empty while a member has access, or never had any", async () => {
    expect(await endedAt(active)).toBeNull();
    expect(await endedAt(never)).toBeNull();
  });
  it("is the grant's end date, or the moment a refund stopped it", async () => {
    expect((await endedAt(ended))!.getTime()).toBe(new Date("2025-03-01T00:00:00Z").getTime());
    expect((await endedAt(refunded))!.toISOString()).toBe("2025-06-10T10:00:00.000Z");
  });
});

describe("retention facts for the daily job", () => {
  it("lists lapsed members only, marks staff and open requests, and is server only", async () => {
    await db.query("begin");
    try {
      await db.query("insert into public.deletion_requests (user_id) values ($1)", [refunded]);
      await db.query("insert into public.retention_notices (user_id, kind, access_ended_at) values ($1, '30_days', app.access_ended_at($1))", [ended]);
      await db.query("set local role service_role");
      const rows = (await db.query("select user_id, basis, is_staff, has_open_request, held, notices from public.retention_facts() where user_id = any($1)", [[active, ended, refunded, staff, never]])).rows;
      const by = Object.fromEntries(rows.map((r) => [r.user_id, r]));
      // Active members are not listed; the account that never bought anything is, under the inactivity rule.
      expect(Object.keys(by).sort()).toEqual([ended, refunded, staff, never].sort());
      expect(by[never]).toMatchObject({ basis: "inactive", is_staff: false, held: false });
      expect(by[ended]).toMatchObject({ basis: "access_ended", is_staff: false, has_open_request: false, held: false, notices: ["30_days"] });
      expect(by[refunded]).toMatchObject({ has_open_request: true });
      expect(by[staff]).toMatchObject({ is_staff: true });
    } finally {
      await db.query("rollback");
    }
    for (const who of [ended, admin]) {
      await expect(asUser(db, who, (q) => q("select * from public.retention_facts()"))).rejects.toThrow(/permission denied/);
    }
  });

  it("job runs and reminders are visible to admins only", async () => {
    await db.query("insert into public.job_runs (job, status, finished_at, summary) values ('data_rights', 'ok', now(), '{\"reminders\": 1}')");
    expect(await asUser(db, admin, (q) => q("select job from public.job_runs where job = 'data_rights'"))).not.toHaveLength(0);
    expect(await asUser(db, ended, (q) => q("select job from public.job_runs"))).toHaveLength(0);
    expect(await asUser(db, ended, (q) => q("select id from public.retention_notices"))).toHaveLength(0);
  });
});

describe("purchase record retention", () => {
  it("removes anonymized purchase records older than 7 years and keeps the rest", async () => {
    await db.query("begin");
    try {
      const old = (await db.query("insert into public.orders (user_id, email, sku, price_id, payment_plan, status, amount_cents, installments_total, installments_paid, created_at, updated_at) select null, 'deleted-user-0123456789', 'blueprint', p.id, p.plan, 'paid', p.amount_cents, p.installment_count, 1, now() - interval '8 years', now() - interval '8 years' from public.prices p where p.sku = 'blueprint' and p.plan = 'pay_in_full' returning id")).rows[0].id;
      const recent = (await db.query("insert into public.orders (user_id, email, sku, price_id, payment_plan, status, amount_cents, installments_total, installments_paid, created_at, updated_at) select null, 'deleted-user-abcdefabcd', 'blueprint', p.id, p.plan, 'paid', p.amount_cents, p.installment_count, 1, now() - interval '6 years', now() - interval '6 years' from public.prices p where p.sku = 'blueprint' and p.plan = 'pay_in_full' returning id")).rows[0].id;
      await db.query("update public.orders set created_at = now() - interval '9 years', updated_at = now() - interval '9 years' where user_id = $1", [active]);
      await db.query("set local role service_role");
      expect((await db.query("select public.purge_expired_purchase_records(7) as n")).rows[0].n).toBe(1);
      await db.query("reset role");
      const left = (await db.query("select id from public.orders where id = any($1)", [[old, recent]])).rows.map((r) => r.id);
      expect(left).toEqual([recent]);
      // A current member's own old orders are not touched.
      expect((await db.query("select 1 from public.orders where user_id = $1", [active])).rows).toHaveLength(1);
    } finally {
      await db.query("rollback");
    }
  });
});

describe("payments still owed hold a deletion", () => {
  it("counts remaining installments and past due memberships; members see only their own, admins anyone", async () => {
    const owing = await createUser(db, "ret-owing");
    try {
      await paidOrder(db, owing, "blueprint", { plan: "six_installments" });
      await db.query("update public.orders set installments_paid = 2 where user_id = $1", [owing]);
      const mine = await asUser(db, owing, (q) => q("select kind, sku, remaining_payments, amount_cents from public.deletion_balances($1)", [[owing, active]]));
      expect(mine).toEqual([{ kind: "installments", sku: "blueprint", remaining_payments: 4, amount_cents: "38800" }]);
      expect(await asUser(db, ended, (q) => q("select 1 from public.deletion_balances($1)", [[owing]]))).toHaveLength(0);
      expect(await asUser(db, admin, (q) => q("select 1 from public.deletion_balances($1)", [[owing]]))).toHaveLength(1);
      await db.query("begin");
      try {
        await db.query("update public.entitlements set starts_at = '2024-01-01', ends_at = '2025-01-01' where user_id = $1", [owing]);
        await db.query("set local role service_role");
        const [f] = (await db.query("select held from public.retention_facts() where user_id = $1", [owing])).rows;
        expect(f).toEqual({ held: true });
      } finally {
        await db.query("rollback");
      }
    } finally {
      await db.query("delete from public.orders where user_id = $1", [owing]);
      await db.query("delete from auth.users where id = $1", [owing]);
    }
  });
});

describe("admins record a deletion request for a member", () => {
  it("creates one open request, logs the admin, and is admins only", async () => {
    const rows = await asUser(db, admin, async (q) => {
      const [first] = await q<{ id: string; recorded_by: string; status: string }>("select * from public.admin_record_deletion($1)", [ended]);
      const [again] = await q<{ id: string }>("select * from public.admin_record_deletion($1)", [ended]);
      expect(again!.id).toBe(first!.id);
      expect(first).toMatchObject({ recorded_by: admin, status: "pending" });
      return q("select actor_id, action from public.admin_audit_log where entity_id = $1", [first!.id]);
    });
    expect(rows).toEqual([{ actor_id: admin, action: "deletion.recorded" }]);
    await expect(asUser(db, staff, (q) => q("select * from public.admin_record_deletion($1)", [ended]))).rejects.toThrow(/admin role required/);
    await expect(asUser(db, admin, (q) => q("select * from public.admin_record_deletion($1)", [admin]))).rejects.toThrow(/use My Account/);
  });
});

