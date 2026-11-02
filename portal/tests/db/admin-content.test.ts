import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, connect, createUser, expectDenied, paidOrder } from "./helpers";

let db: Client;
let admin: string;
let coach: string;
let student: string;

beforeAll(async () => {
  db = await connect();
  admin = await createUser(db, "admin");
  coach = await createUser(db, "coach");
  student = await createUser(db, "student");
  await db.query("insert into public.user_roles (user_id, role) values ($1, 'admin'), ($2, 'coach')", [admin, coach]);
  await paidOrder(db, student, "blueprint");
});
afterAll(async () => {
  await db.end();
});

async function commitAs(userId: string, sql: string, params: unknown[] = []) {
  await db.query("begin");
  await db.query("set local role authenticated");
  await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: userId, role: "authenticated" })]);
  try {
    const r = await db.query(sql, params);
    await db.query("commit");
    return r.rows;
  } catch (e) {
    await db.query("rollback");
    throw e;
  }
}

describe("content workflow (D14)", () => {
  it("admins create, review, and publish lessons; every change is audited", async () => {
    const [lesson] = await commitAs(
      admin,
      "insert into public.lessons (module_id, slug, order_index, title, status) select id, 'admin-made', 40, 'Admin made lesson', 'draft' from public.modules where number = 3 returning id",
    );
    expect(await asUser(db, student, (q) => q("select id from public.lessons where id = $1", [lesson.id]))).toHaveLength(0);
    await commitAs(admin, "update public.lessons set status = 'review' where id = $1", [lesson.id]);
    await commitAs(admin, "update public.lessons set status = 'published' where id = $1", [lesson.id]);
    expect(await asUser(db, student, (q) => q("select id from public.lessons where id = $1", [lesson.id]))).toHaveLength(1);
    const log = await db.query("select action, changed_fields from public.admin_audit_log where entity_id = $1 order by id", [lesson.id]);
    expect(log.rows.map((r) => r.action)).toEqual(["lessons.insert", "lessons.update", "lessons.update"]);
    expect(log.rows[2].changed_fields.status).toEqual({ from: "review", to: "published" });
  });

  it("coaches can read drafts and suggest edits but cannot publish", async () => {
    const drafts = await asUser(db, coach, (q) => q("select id from public.lessons where status = 'draft'"));
    expect(drafts.length).toBeGreaterThan(0);
    const changed = await asUser(db, coach, (q) => q("update public.lessons set status = 'published' where id = $1 returning id", [drafts[0]!.id]));
    expect(changed).toHaveLength(0);
    const rows = await commitAs(coach, "insert into public.content_suggestions (lesson_id, author_id, body) values ($1, $2, 'Tighten the intro') returning id", [drafts[0]!.id, coach]);
    expect(rows).toHaveLength(1);
  });

  it("students cannot suggest edits or see suggestions", async () => {
    const lesson = await db.query("select id from public.lessons limit 1");
    await expectDenied(db, student, "insert into public.content_suggestions (lesson_id, author_id, body) values ($1, $2, 'hello there')", [lesson.rows[0].id, student]);
    expect(await asUser(db, student, (q) => q("select id from public.content_suggestions"))).toHaveLength(0);
  });

  it("admins can attach Stripe price IDs but cannot change approved amounts", async () => {
    await commitAs(admin, "update public.prices set stripe_price_id = 'price_TEST123' where sku = 'blueprint' and plan = 'pay_in_full'");
    await expect(commitAs(admin, "update public.prices set amount_cents = 100 where sku = 'blueprint' and plan = 'pay_in_full'")).rejects.toThrow(/reviewed migration/);
    const changed = await asUser(db, student, (q) => q("update public.prices set stripe_price_id = 'price_X' where sku = 'blueprint' returning id"));
    expect(changed).toHaveLength(0);
  });
});
