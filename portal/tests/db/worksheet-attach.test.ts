import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, connect, createUser, expectDenied, type Q } from "./helpers";

/**
 * Migration 2500 (owner request 2026-11-06): admins attach, move and detach worksheets, reorder lessons and delete
 * sample lessons themselves. One worksheet per lesson; every change is in the audit log with the admin as actor.
 */
let db: Client;
let admin: string;
let coach: string;
let moduleId: string;
let lessonA: string;
let lessonB: string;
let lessonC: string;
let real: string;

/**
 * Like asUser, but commits: these changes must stick, and a swap has to pass the position rule when the transaction
 * ends (that is where a deferred constraint is checked).
 */
async function asAdminCommit<T>(db: Client, userId: string, fn: (q: Q) => Promise<T>): Promise<T> {
  await db.query("begin");
  try {
    await db.query("set local role authenticated");
    await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: userId, role: "authenticated" })]);
    const out = await fn(async (sql, params) => (await db.query(sql, params as unknown[])).rows);
    await db.query("commit");
    return out;
  } catch (err) {
    await db.query("rollback");
    throw err;
  }
}

const lessonOf = async (slug: string) => (await db.query<{ lesson_id: string | null }>("select lesson_id from public.worksheets where slug = $1 order by version", [slug])).rows.map((r) => r.lesson_id);
const positions = async () =>
  Object.fromEntries((await db.query<{ id: string; order_index: number }>("select id, order_index from public.lessons where id = any($1)", [[lessonA, lessonB, lessonC]])).rows.map((r) => [r.id, r.order_index]));

beforeAll(async () => {
  db = await connect();
  [admin, coach] = (await Promise.all(["wa-admin", "wa-coach"].map((l) => createUser(db, l)))) as [string, string];
  await db.query("insert into public.user_roles (user_id, role) values ($1, 'admin'), ($2, 'coach')", [admin, coach]);
  moduleId = (await db.query<{ id: string }>("select id from public.modules where number = 8")).rows[0]!.id;
  const mk = async (slug: string, order: number, sample: boolean) =>
    (
      await db.query<{ id: string }>(
        "insert into public.lessons (module_id, slug, order_index, title, is_sample) values ($1, $2, $3, $4, $5) returning id",
        [moduleId, slug, order, sample ? `SAMPLE: ${slug}` : `Real ${slug}`, sample],
      )
    ).rows[0]!.id;
  lessonA = await mk("wa-lesson-a", 61, true);
  lessonB = await mk("wa-lesson-b", 62, true);
  lessonC = await mk("wa-lesson-c", 64, true);
  real = await mk("wa-lesson-real", 66, false);
  await db.query(
    `insert into public.worksheets (slug, version, lesson_id, title, schema, status) values
       ('wa-one', 1, $1, 'Worksheet one', '{"sections": []}', 'published'),
       ('wa-one', 2, $1, 'Worksheet one v2', '{"sections": []}', 'draft'),
       ('wa-two', 1, $2, 'Worksheet two', '{"sections": []}', 'draft')`,
    [lessonA, lessonB],
  );
});
afterAll(async () => {
  await db.query("delete from public.worksheet_responses where worksheet_slug like 'wa-%'");
  await db.query("delete from public.worksheets where slug like 'wa-%'");
  await db.query("delete from public.lessons where slug like 'wa-lesson-%'");
  await db.end();
});

describe("attaching worksheets", () => {
  it("one worksheet per lesson: a second worksheet cannot be put on a lesson directly", async () => {
    await expect(db.query("update public.worksheets set lesson_id = $1 where slug = 'wa-two'", [lessonA])).rejects.toThrow(/already has a worksheet/);
  });

  it("moves every version of a worksheet to another lesson, as the admin, in the audit log", async () => {
    const r = await asAdminCommit(db, admin, (q) => q<{ attach_worksheet: { from: string; replaced: string | null } }>("select public.attach_worksheet('wa-one', $1)", [lessonC]));
    expect(r[0]!.attach_worksheet).toEqual({ from: lessonA, replaced: null });
    expect(await lessonOf("wa-one")).toEqual([lessonC, lessonC]);
    const log = await db.query("select actor_id, changed_fields from public.admin_audit_log where entity_type = 'worksheets' and changed_fields ? 'lesson_id' and changed_fields->'lesson_id'->>'to' = $1", [lessonC]);
    expect(log.rows).toHaveLength(2);
    expect(log.rows.every((x) => x.actor_id === admin && x.changed_fields.lesson_id.from === lessonA)).toBe(true);
  });

  it("onto a lesson that has a worksheet: that one is detached, and both changes are logged", async () => {
    const r = await asAdminCommit(db, admin, (q) => q<{ attach_worksheet: { from: string; replaced: string | null } }>("select public.attach_worksheet('wa-two', $1)", [lessonC]));
    expect(r[0]!.attach_worksheet).toEqual({ from: lessonB, replaced: "wa-one" });
    expect(await lessonOf("wa-two")).toEqual([lessonC]);
    expect(await lessonOf("wa-one")).toEqual([null, null]);
    const detached = await db.query("select 1 from public.admin_audit_log where actor_id = $1 and entity_type = 'worksheets' and changed_fields->'lesson_id'->>'from' = $2 and changed_fields->'lesson_id'->'to' = 'null'::jsonb", [admin, lessonC]);
    expect(detached.rows.length).toBe(2);
  });

  it("a detached worksheet is never served to members, even when published", async () => {
    expect(await asUser(db, null, (q) => q("select 1 from public.worksheets where slug = 'wa-one'"))).toHaveLength(0);
    const student = await createUser(db, "wa-student");
    expect(await asUser(db, student, (q) => q("select 1 from public.worksheets where slug = 'wa-one'"))).toHaveLength(0);
  });

  it("detach with null, and attach again", async () => {
    await asAdminCommit(db, admin, (q) => q("select public.attach_worksheet('wa-two', null)"));
    expect(await lessonOf("wa-two")).toEqual([null]);
    await asAdminCommit(db, admin, (q) => q("select public.attach_worksheet('wa-one', $1)", [lessonA]));
    expect(await lessonOf("wa-one")).toEqual([lessonA, lessonA]);
  });

  it("only admins can attach; unknown worksheets and lessons are refused", async () => {
    await expectDenied(db, coach, "select public.attach_worksheet('wa-two', $1)", [lessonB]);
    await expectDenied(db, null, "select public.attach_worksheet('wa-two', $1)", [lessonB]);
    await expect(asUser(db, admin, (q) => q("select public.attach_worksheet('wa-missing', $1)", [lessonB]))).rejects.toThrow(/Worksheet not found/);
    await expect(asUser(db, admin, (q) => q("select public.attach_worksheet('wa-two', $1)", ["00000000-0000-0000-0000-000000000000"]))).rejects.toThrow(/Lesson not found/);
  });
});

describe("reordering lessons", () => {
  it("swaps neighbours without hitting the position rule, skipping gaps, as the admin", async () => {
    const before = await positions();
    const r = await asAdminCommit(db, admin, (q) => q<{ move_lesson: { moved: boolean } }>("select public.move_lesson($1, 'down')", [lessonB]));
    expect(r[0]!.move_lesson.moved).toBe(true);
    // B (62) and C (64) swap; the gap at 63 stays.
    expect(await positions()).toEqual({ ...before, [lessonB]: 64, [lessonC]: 62 });
    await asAdminCommit(db, admin, (q) => q("select public.move_lesson($1, 'up')", [lessonB]));
    expect(await positions()).toEqual(before);
    const log = await db.query("select count(*)::int as n from public.admin_audit_log where actor_id = $1 and entity_type = 'lessons' and changed_fields ? 'order_index'", [admin]);
    expect(log.rows[0]!.n).toBe(4);
  });

  it("does nothing past either end of the module", async () => {
    const last = (await db.query<{ id: string }>("select id from public.lessons where module_id = $1 order by order_index desc limit 1", [moduleId])).rows[0]!.id;
    const r = await asUser(db, admin, (q) => q<{ move_lesson: { moved: boolean } }>("select public.move_lesson($1, 'down')", [last]));
    expect(r[0]!.move_lesson.moved).toBe(false);
  });

  it("the position rule still holds for an ordinary save", async () => {
    await expect(asUser(db, admin, (q) => q("update public.lessons set order_index = 62 where id = $1", [lessonA]))).rejects.toThrow(/lessons_module_id_order_index_key/);
    await expectDenied(db, coach, "select public.move_lesson($1, 'down')", [lessonA]);
  });
});

describe("deleting lessons", () => {
  it("a bare DELETE is refused even for an admin: lessons are deleted only through delete_lesson", async () => {
    await expect(asUser(db, admin, (q) => q("delete from public.lessons where id = $1", [lessonB]))).rejects.toThrow(/Delete lessons with the Delete button/);
  });

  it("a sample lesson deletes with a simple confirm; its worksheet is detached, not deleted, and one audit entry lists it", async () => {
    // wa-one sits on lesson A (attached back above). A member has progress and answers on it.
    const member = await createUser(db, "wa-member");
    await db.query("insert into public.lesson_progress (user_id, lesson_id) values ($1, $2)", [member, lessonA]);
    await db.query("insert into public.worksheet_responses (user_id, worksheet_slug, worksheet_version, answers) values ($1, 'wa-one', 1, '{\"q1\":\"kept\"}')", [member]);
    const preview = await asUser(db, admin, (q) => q<{ lesson_delete_preview: Record<string, unknown> }>("select public.lesson_delete_preview($1)", [lessonA]));
    expect(preview[0]!.lesson_delete_preview).toMatchObject({ is_sample: true, progress: 1, answers: 1, worksheets: [{ slug: "wa-one", title: expect.any(String) }] });
    const r = await asAdminCommit(db, admin, (q) => q<{ delete_lesson: { removed: Record<string, unknown> } }>("select public.delete_lesson($1)", [lessonA]));
    expect(r[0]!.delete_lesson.removed).toMatchObject({ progress: 1, answers: 1, worksheets_detached: [{ slug: "wa-one" }] });
    expect((await db.query("select 1 from public.lessons where id = $1", [lessonA])).rows).toHaveLength(0);
    expect((await db.query("select 1 from public.lesson_progress where lesson_id = $1", [lessonA])).rows).toHaveLength(0);
    // The worksheet and the member's answer stay.
    expect(await lessonOf("wa-one")).toEqual([null, null]);
    expect((await db.query("select answers->>'q1' as a from public.worksheet_responses where user_id = $1", [member])).rows).toEqual([{ a: "kept" }]);
    const log = await db.query("select actor_id, changed_fields from public.admin_audit_log where action = 'lessons.delete_permanently' and entity_id = $1", [lessonA]);
    expect(log.rows).toHaveLength(1);
    expect(log.rows[0]!.actor_id).toBe(admin);
    expect(log.rows[0]!.changed_fields).toMatchObject({ title: "SAMPLE: wa-lesson-a", order_index: 61, removed: { progress: 1, worksheets_detached: [{ slug: "wa-one" }] } });
    // The position is free at once.
    await db.query("insert into public.lessons (module_id, slug, order_index, title, is_sample) values ($1, 'wa-lesson-a2', 61, 'SAMPLE: wa-lesson-a2', true)", [moduleId]);
  });

  it("members' roadmap links to a deleted lesson become empty; the items stay, and members still cannot change links", async () => {
    const member = await createUser(db, "wa-roadmap");
    const lesson = (await db.query<{ id: string }>("insert into public.lessons (module_id, slug, order_index, title, is_sample) values ($1, 'wa-lesson-road', 75, 'SAMPLE: road', true) returning id", [moduleId])).rows[0]!.id;
    const item = (
      await db.query<{ id: string }>("insert into public.roadmap_items (user_id, month_number, priority_order, title, recommended_lesson_id) values ($1, 1, 1, 'Do the road lesson', $2) returning id", [member, lesson])
    ).rows[0]!.id;
    // A member's own attempt changes nothing (no rows, or the guard refuses it).
    await asUser(db, member, (q) => q("update public.roadmap_items set recommended_lesson_id = null where id = $1", [item])).catch(() => undefined);
    expect((await db.query("select recommended_lesson_id from public.roadmap_items where id = $1", [item])).rows[0]!.recommended_lesson_id).toBe(lesson);
    await asAdminCommit(db, admin, (q) => q("select public.delete_lesson($1)", [lesson]));
    const row = await db.query("select title, recommended_lesson_id from public.roadmap_items where id = $1", [item]);
    expect(row.rows).toEqual([{ title: "Do the road lesson", recommended_lesson_id: null }]);
    const log = await db.query("select changed_fields->'removed'->>'roadmap_links' as n from public.admin_audit_log where action = 'lessons.delete_permanently' and entity_id = $1", [lesson]);
    expect(log.rows).toEqual([{ n: "1" }]);
  });

  it("a real lesson with member data needs its exact title typed", async () => {
    const member = await createUser(db, "wa-member-real");
    await db.query("insert into public.lesson_progress (user_id, lesson_id) values ($1, $2)", [member, real]);
    await expect(asUser(db, admin, (q) => q("select public.delete_lesson($1)", [real]))).rejects.toThrow(/Type the lesson title/);
    await expect(asUser(db, admin, (q) => q("select public.delete_lesson($1, 'Real wa-lesson')", [real]))).rejects.toThrow(/Type the lesson title/);
    await asAdminCommit(db, admin, (q) => q("select public.delete_lesson($1, 'Real wa-lesson-real')", [real]));
    expect((await db.query("select 1 from public.lessons where id = $1", [real])).rows).toHaveLength(0);
  });

  it("only admins can preview or delete", async () => {
    await expectDenied(db, coach, "select public.lesson_delete_preview($1)", [lessonC]);
    await expectDenied(db, coach, "select public.delete_lesson($1)", [lessonC]);
    await expectDenied(db, coach, "select public.delete_sample_lessons()");
    await expectDenied(db, admin, "select app.delete_lesson_core($1, null, null)", [lessonC]);
  });

  it("delete all sample lessons: detaches their worksheets first and says which (rolled back: the seed's samples stay)", async () => {
    await asAdminCommit(db, admin, (q) => q("select public.attach_worksheet('wa-two', $1)", [lessonC]));
    await asUser(db, admin, async (q) => {
      const r = await q<{ delete_sample_lessons: { title: string; removed: { worksheets_detached: { slug: string }[] } }[] }>("select public.delete_sample_lessons()");
      const detached = r[0]!.delete_sample_lessons.flatMap((x) => x.removed.worksheets_detached.map((w) => w.slug));
      expect(detached).toContain("wa-two");
      expect((await q<{ n: number }>("select count(*)::int as n from public.lessons where is_sample"))[0]!.n).toBe(0);
      expect((await q<{ lesson_id: string | null }>("select lesson_id from public.worksheets where slug = 'wa-two'"))[0]!.lesson_id).toBeNull();
      expect((await q<{ n: number }>("select count(*)::int as n from public.admin_audit_log where action = 'lessons.delete_permanently' and actor_id = $1", [admin]))[0]!.n).toBeGreaterThan(2);
    });
  });
});

describe("positions and publish rules", () => {
  it("positions run to 999", async () => {
    const id = (await db.query<{ id: string }>("insert into public.lessons (module_id, slug, order_index, title) values ($1, 'wa-lesson-far', 902, 'Real far lesson') returning id", [moduleId])).rows[0]!.id;
    await expect(db.query("update public.lessons set order_index = 1000 where id = $1", [id])).rejects.toThrow(/lessons_order_index_check/);
  });

  it("a published video lesson without captions can still move position; publishing it still needs captions", async () => {
    const id = (
      await db.query<{ id: string }>(
        "insert into public.lessons (module_id, slug, order_index, title, video_provider, video_provider_id, captions_ready, transcript) values ($1, 'wa-lesson-video', 70, 'Real video lesson', 'mux', 'abcdefghij123', true, 'Words') returning id",
        [moduleId],
      )
    ).rows[0]!.id;
    await db.query("update public.lessons set status = 'published' where id = $1", [id]);
    // Published before the rules applied to it, captions since unticked (as an older lesson can be).
    await db.query("alter table public.lessons disable trigger lessons_publish_guard");
    await db.query("update public.lessons set captions_ready = false where id = $1", [id]);
    await db.query("alter table public.lessons enable trigger lessons_publish_guard");
    await asAdminCommit(db, admin, (q) => q("update public.lessons set order_index = 71, title = 'Real video lesson, moved' where id = $1", [id]));
    expect((await db.query("select order_index from public.lessons where id = $1", [id])).rows[0]!.order_index).toBe(71);
    await expect(asUser(db, admin, (q) => q("update public.lessons set transcript = 'Changed words' where id = $1", [id]))).rejects.toThrow(/Captions are required/);
    await db.query("update public.lessons set status = 'draft' where id = $1", [id]);
    await expect(asUser(db, admin, (q) => q("update public.lessons set status = 'published' where id = $1", [id]))).rejects.toThrow(/Captions are required/);
  });
});
