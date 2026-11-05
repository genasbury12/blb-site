import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, connect, createUser, expectDenied } from "./helpers";

/** 10_DATA_RIGHTS Slice A: who may export whose data, the 10 minute limit, and the audit entry (no content). */
let db: Client;
let member: string;
let other: string;
let coach: string;
let admin: string;

beforeAll(async () => {
  db = await connect();
  [member, other, coach, admin] = (await Promise.all(["dx-member", "dx-other", "dx-coach", "dx-admin"].map((l) => createUser(db, l)))) as [string, string, string, string];
  await db.query("insert into public.user_roles (user_id, role) values ($1, 'coach'), ($2, 'admin')", [coach, admin]);
  await db.query("insert into public.coach_assignments (coach_id, student_id) values ($1, $2)", [coach, member]);
});
afterAll(async () => {
  await db.end();
});

type Q = (sql: string, p?: unknown[]) => Promise<unknown[]>;
const start = (q: Q, user: string) => q("select public.start_data_export($1) as id", [user]) as Promise<{ id: string }[]>;

/** Expect a statement to fail without aborting the surrounding test transaction. */
async function rejects(q: Q, sql: string, params: unknown[], pattern: RegExp) {
  await q("savepoint t");
  let error: Error | undefined;
  try {
    await q(sql, params);
  } catch (err) {
    error = err as Error;
  }
  await q("rollback to savepoint t");
  expect(error?.message).toMatch(pattern);
}

describe("data export permissions", () => {
  it("a member exports only their own data; coaches and anonymous callers cannot export anyone", async () => {
    await expect(asUser(db, member, (q) => start(q, member))).resolves.toHaveLength(1);
    await expectDenied(db, member, "select public.start_data_export($1)", [other]);
    await expectDenied(db, coach, "select public.start_data_export($1)", [member]);
    await expectDenied(db, null, "select public.start_data_export($1)", [member]);
  });

  it("an admin may export any member", async () => {
    await expect(asUser(db, admin, (q) => start(q, other))).resolves.toHaveLength(1);
  });
});

describe("data export limit and audit entry", () => {
  it("one export per member per 10 minutes; a failed one can be retried; the audit entry has the size only", async () => {
    const out = await asUser(db, member, async (q) => {
      const [first] = await start(q, member);
      await rejects(q, "select public.start_data_export($1)", [member], /rate_limited/);
      // Mark the first failed: the limit frees up and nothing is audited.
      await q("select public.finish_data_export($1, null)", [first!.id]);
      const [second] = await start(q, member);
      await q("select public.finish_data_export($1, 12345)", [second!.id]);
      await rejects(q, "select public.start_data_export($1)", [member], /rate_limited/);
      return q(
        "select status, bytes, via, requested_by from public.data_exports where user_id = $1 order by created_at",
        [member],
      );
    });
    expect(out).toEqual([
      { status: "failed", bytes: null, via: "member", requested_by: member },
      { status: "completed", bytes: "12345", via: "member", requested_by: member },
    ]);
  });

  it("records the audit entry inside the transaction (member: no actor; admin: the admin)", async () => {
    const rows = await asUser(db, member, async (q) => {
      const [x] = await start(q, member);
      await q("select public.finish_data_export($1, 99)", [x!.id]);
      // Only admins read the audit log: look at it as the admin, same transaction.
      await q("select set_config('request.jwt.claims', json_build_object('sub', $1::text, 'role', 'authenticated')::text, true)", [admin]);
      return q("select actor_id, entity_type, entity_id, changed_fields from public.admin_audit_log where action = 'data.export' and entity_id = $1", [member]);
    });
    expect(rows).toEqual([{ actor_id: null, entity_type: "user", entity_id: member, changed_fields: { bytes: 99, via: "member" } }]);
    const adminRows = await asUser(db, admin, async (q) => {
      const [x] = await start(q, other);
      await q("select public.finish_data_export($1, 77)", [x!.id]);
      return q("select actor_id, entity_id, changed_fields from public.admin_audit_log where action = 'data.export' and entity_id = $1", [other]);
    });
    expect(adminRows).toEqual([{ actor_id: admin, entity_id: other, changed_fields: { bytes: 77, via: "admin" } }]);
  });

  it("only the person who started an export can finish it", async () => {
    await asUser(db, member, async (q) => {
      const [x] = await start(q, member);
      // Same transaction, now signed in as someone else.
      await q("select set_config('request.jwt.claims', json_build_object('sub', $1::text, 'role', 'authenticated')::text, true)", [other]);
      await rejects(q, "select public.finish_data_export($1, 1)", [x!.id], /unknown export/);
    });
  });

  it("members read only their own export records", async () => {
    const seen = await asUser(db, other, (q) => q("select user_id from public.data_exports"));
    expect(seen.every((r) => (r as { user_id: string }).user_id === other)).toBe(true);
  });
});
