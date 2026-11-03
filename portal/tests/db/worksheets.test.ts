import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, connect, createUser, expectDenied, paidOrder } from "./helpers";

/** 09_IMPLEMENT_WORKSHEETS Slice A: worksheets and worksheet_responses RLS, as the Data API runs it. */
let db: Client;
let student: string;
let other: string;
let noAccess: string;
let coach: string;
let otherCoach: string;
let admin: string;
let lesson: string;

const insertOwn = "insert into public.worksheet_responses (user_id, worksheet_slug, worksheet_version, answers) values ($1, $2, 1, $3) returning id";

beforeAll(async () => {
  db = await connect();
  const ids = await Promise.all(["ws-student", "ws-other", "ws-noaccess", "ws-coach", "ws-coach2", "ws-admin"].map((l) => createUser(db, l)));
  [student, other, noAccess, coach, otherCoach, admin] = ids as [string, string, string, string, string, string];
  await paidOrder(db, student, "blueprint");
  await paidOrder(db, other, "blueprint");
  await db.query("insert into public.user_roles (user_id, role) values ($1, 'coach'), ($2, 'coach'), ($3, 'admin')", [coach, otherCoach, admin]);
  await db.query("insert into public.coach_assignments (coach_id, student_id) values ($1, $2)", [coach, student]);
  const { rows } = await db.query<{ id: string }>(
    "select l.id from public.lessons l join public.modules m on m.id = l.module_id where m.number = 1 and l.status = 'published' order by l.order_index limit 1",
  );
  lesson = rows[0]!.id;
  await db.query(
    `insert into public.worksheets (slug, version, lesson_id, title, schema, status) values
       ('ws-published', 1, $1, 'Published worksheet', '{"sections": []}', 'published'),
       ('ws-draft', 1, $1, 'Draft worksheet', '{"sections": []}', 'draft'),
       ('ws-review', 1, $1, 'Review worksheet', '{"sections": []}', 'review')`,
    [lesson],
  );
});
afterAll(async () => {
  await db.end();
});

describe("worksheets visibility (draft never served)", () => {
  it("entitled students see only published worksheets; staff see all; others none", async () => {
    const slugs = async (u: string | null) => (await asUser(db, u, (q) => q<{ slug: string }>("select slug from public.worksheets order by slug"))).map((r) => r.slug);
    expect(await slugs(student)).toEqual(["ws-published"]);
    expect(await slugs(noAccess)).toEqual([]);
    expect(await slugs(null)).toEqual([]);
    expect(await slugs(coach)).toEqual(expect.arrayContaining(["ws-draft", "ws-published", "ws-review"]));
    expect(await slugs(admin)).toEqual(expect.arrayContaining(["ws-draft", "ws-published", "ws-review"]));
  });
  it("only admins create or change worksheets", async () => {
    // Row security hides rows the caller may not change: the update touches nothing.
    expect(await asUser(db, student, (q) => q("update public.worksheets set title = 'Hacked' where slug = 'ws-published' returning id"))).toHaveLength(0);
    expect(await asUser(db, coach, (q) => q("update public.worksheets set status = 'published' where slug = 'ws-draft' returning id"))).toHaveLength(0);
    await expectDenied(db, coach, "insert into public.worksheets (slug, lesson_id, title, schema) values ('ws-coach', $1, 'Coach made', '{}')", [lesson]);
    expect(await asUser(db, admin, (q) => q("update public.worksheets set title = 'Published worksheet' where slug = 'ws-published' returning id"))).toHaveLength(1);
  });
  it("one published version per worksheet", async () => {
    await expect(
      db.query("insert into public.worksheets (slug, version, lesson_id, title, schema, status) values ('ws-published', 2, $1, 'Second', '{}', 'published')", [lesson]),
    ).rejects.toThrow(/worksheets_one_published_idx/);
  });
});

describe("worksheet responses (own data only)", () => {
  it("a student saves and reads only their own response", async () => {
    const [r] = await asUser(db, student, (q) => q<{ id: string }>(insertOwn, [student, "ws-published", JSON.stringify({ q1: "My answer" })]));
    await db.query("insert into public.worksheet_responses (id, user_id, worksheet_slug, worksheet_version, answers) values (default, $1, 'ws-published', 1, '{\"q1\":\"Other answer\"}')", [other]);
    // Persist the student's row for the following tests (asUser rolls back).
    await db.query("insert into public.worksheet_responses (user_id, worksheet_slug, worksheet_version, answers) values ($1, 'ws-published', 1, '{\"q1\":\"My answer\"}')", [student]);
    expect(r).toBeTruthy();
    const mine = await asUser(db, student, (q) => q<{ user_id: string }>("select user_id from public.worksheet_responses"));
    expect(mine.map((m) => m.user_id)).toEqual([student]);
    const updated = await asUser(db, student, (q) => q("update public.worksheet_responses set answers = answers || '{\"q2\":\"More\"}' where user_id = $1 returning id", [student]));
    expect(updated).toHaveLength(1);
  });
  it("another student can neither read nor write it (direct API, not UI)", async () => {
    expect(await asUser(db, other, (q) => q("select id from public.worksheet_responses where user_id = $1", [student]))).toHaveLength(0);
    expect(await asUser(db, other, (q) => q("update public.worksheet_responses set answers = '{}' where user_id = $1 returning id", [student]))).toHaveLength(0);
    await expectDenied(db, other, insertOwn, [student, "ws-published", "{}"]);
    expect(await asUser(db, other, (q) => q("delete from public.worksheet_responses where user_id = $1 returning id", [student]))).toHaveLength(0);
  });
  it("anonymous visitors get nothing", async () => {
    expect(await asUser(db, null, (q) => q("select id from public.worksheet_responses"))).toHaveLength(0);
    expect(await asUser(db, null, (q) => q("update public.worksheet_responses set answers = '{}' returning id"))).toHaveLength(0);
    await expectDenied(db, null, insertOwn, [student, "ws-published", "{}"]);
  });
  it("draft, review, or unentitled: no saving", async () => {
    await expectDenied(db, student, insertOwn, [student, "ws-draft", "{}"]);
    await expectDenied(db, student, insertOwn, [student, "ws-review", "{}"]);
    await expectDenied(db, noAccess, insertOwn, [noAccess, "ws-published", "{}"]);
  });
  it("a response cannot be moved to another account or worksheet", async () => {
    await expect(asUser(db, student, (q) => q("update public.worksheet_responses set user_id = $2 where user_id = $1", [student, other]))).rejects.toThrow();
    await expect(asUser(db, student, (q) => q("update public.worksheet_responses set worksheet_slug = 'ws-draft' where user_id = $1", [student]))).rejects.toThrow();
  });
  it("students cannot delete; complete keeps completed_at and stays editable", async () => {
    expect(await asUser(db, student, (q) => q("delete from public.worksheet_responses where user_id = $1 returning id", [student]))).toHaveLength(0);
    await expect(asUser(db, student, (q) => q("update public.worksheet_responses set status = 'complete' where user_id = $1", [student]))).rejects.toThrow(/check/);
    const done = await asUser(db, student, (q) => q("update public.worksheet_responses set status = 'complete', completed_at = now() where user_id = $1 returning id", [student]));
    expect(done).toHaveLength(1);
  });
});

describe("staff access (D09: coaches see assigned members only)", () => {
  it("assigned coach reads, unassigned coach does not, neither writes", async () => {
    const seen = await asUser(db, coach, (q) => q<{ user_id: string }>("select user_id from public.worksheet_responses"));
    expect(seen.map((s) => s.user_id)).toEqual([student]);
    expect(await asUser(db, otherCoach, (q) => q("select id from public.worksheet_responses"))).toHaveLength(0);
    expect(await asUser(db, coach, (q) => q("update public.worksheet_responses set answers = '{}' where user_id = $1 returning id", [student]))).toHaveLength(0);
    expect(await asUser(db, coach, (q) => q("delete from public.worksheet_responses where user_id = $1 returning id", [student]))).toHaveLength(0);
  });
  it("admins read all and delete, and the delete is audited without answer content", async () => {
    const all = await asUser(db, admin, (q) => q<{ user_id: string }>("select user_id from public.worksheet_responses"));
    expect(all.map((a) => a.user_id).sort()).toEqual([student, other].sort());
    await db.query("begin");
    await db.query("set local role authenticated");
    await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: admin, role: "authenticated" })]);
    const del = await db.query("delete from public.worksheet_responses where user_id = $1 returning id", [other]);
    await db.query("commit");
    expect(del.rows).toHaveLength(1);
    const log = await db.query("select action, changed_fields from public.admin_audit_log where entity_type = 'worksheet_responses' and actor_id = $1", [admin]);
    expect(log.rows).toEqual([{ action: "worksheet_responses.delete", changed_fields: { deleted: true } }]);
    expect(JSON.stringify(log.rows)).not.toContain("Other answer");
  });
});
