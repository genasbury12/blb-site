import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, connect, createUser, expectDenied, paidOrder } from "./helpers";

let db: Client;
let student: string;
let other: string;
let noAccess: string;
let publishedLesson: string;
let draftLesson: string;

beforeAll(async () => {
  db = await connect();
  student = await createUser(db, "learner");
  other = await createUser(db, "other");
  noAccess = await createUser(db, "noaccess");
  await paidOrder(db, student, "blueprint");
  await paidOrder(db, other, "blueprint");
  const { rows } = await db.query<{ id: string; status: string }>(
    "select l.id, l.status from public.lessons l join public.modules m on m.id = l.module_id where m.number = 1 order by l.order_index",
  );
  publishedLesson = rows.find((r) => r.status === "published")!.id;
  draftLesson = rows.find((r) => r.status === "draft")!.id;
});
afterAll(async () => {
  await db.end();
});

describe("published content only (D14)", () => {
  it("entitled students see published lessons and never drafts", async () => {
    const rows = await asUser(db, student, (q) => q<{ id: string; status: string }>("select id, status from public.lessons"));
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.status === "published")).toBe(true);
    expect(rows.find((r) => r.id === draftLesson)).toBeUndefined();
  });
  it("accounts without a curriculum grant see no lessons or modules", async () => {
    expect(await asUser(db, noAccess, (q) => q("select id from public.lessons"))).toHaveLength(0);
    expect(await asUser(db, noAccess, (q) => q("select id from public.modules"))).toHaveLength(0);
  });
  it("sample lessons cannot be published where sample content is not allowed", async () => {
    await db.query("begin");
    await db.query("update public.app_config set value = 'false' where key = 'allow_sample_content'");
    await expect(
      db.query(
        "insert into public.lessons (module_id, slug, order_index, title, is_sample, status) select id, 'sample-x', 50, 'SAMPLE: x', true, 'published' from public.modules where number = 2",
      ),
    ).rejects.toThrow(/Sample lessons cannot be published/);
    await db.query("rollback");
  });
  it("video lessons need captions and a transcript before publishing", async () => {
    await db.query("begin");
    await expect(
      db.query(
        "insert into public.lessons (module_id, slug, order_index, title, video_provider, video_provider_id, status) select id, 'real-video', 60, 'Real lesson', 'mux', 'abc', 'published' from public.modules where number = 2",
      ),
    ).rejects.toThrow(/Captions are required/);
    await db.query("rollback");
  });
  it("students cannot edit content", async () => {
    const published = await asUser(db, student, (q) => q("update public.lessons set status = 'published' where id = $1 returning id", [draftLesson]));
    expect(published).toHaveLength(0);
    const changed = await asUser(db, student, (q) => q("update public.lessons set title = 'hacked' where id = $1 returning id", [publishedLesson]));
    expect(changed).toHaveLength(0);
  });
});

describe("lesson progress", () => {
  it("students mark their own visible lessons complete", async () => {
    const rows = await asUser(db, student, (q) =>
      q("insert into public.lesson_progress (user_id, lesson_id) values ($1, $2) returning lesson_id", [student, publishedLesson]),
    );
    expect(rows).toHaveLength(1);
  });
  it("cannot mark a draft lesson, or record progress for someone else", async () => {
    await expectDenied(db, student, "insert into public.lesson_progress (user_id, lesson_id) values ($1, $2)", [student, draftLesson]);
    await expectDenied(db, student, "insert into public.lesson_progress (user_id, lesson_id) values ($1, $2)", [other, publishedLesson]);
  });
  it("cannot read another student's progress", async () => {
    await db.query("insert into public.lesson_progress (user_id, lesson_id) values ($1, $2) on conflict do nothing", [other, publishedLesson]);
    const rows = await asUser(db, student, (q) => q("select user_id from public.lesson_progress where user_id = $1", [other]));
    expect(rows).toHaveLength(0);
  });
  it("expired access cannot record progress but the account remains readable", async () => {
    await expectDenied(db, noAccess, "insert into public.lesson_progress (user_id, lesson_id) values ($1, $2)", [noAccess, publishedLesson]);
    const profile = await asUser(db, noAccess, (q) => q("select user_id from public.profiles where user_id = $1", [noAccess]));
    expect(profile).toHaveLength(1);
  });
});

describe("Implementation Library", () => {
  it("members with library access see published items only; others see nothing", async () => {
    const rows = await asUser(db, student, (q) => q<{ status: string }>("select status from public.library_items"));
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows.every((r) => r.status === "published")).toBe(true);
    expect(await asUser(db, noAccess, (q) => q("select id from public.library_items"))).toHaveLength(0);
  });
});
