import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { addDays, asUser, connect, createUser, expectDenied, paidOrder } from "./helpers";

let db: Client;
let blueprint: string;
let accel: string;
let accel2: string;
let coach: string;
let sessionId: string;

beforeAll(async () => {
  db = await connect();
  blueprint = await createUser(db, "bp");
  accel = await createUser(db, "acc");
  accel2 = await createUser(db, "acc2");
  coach = await createUser(db, "coach");
  await paidOrder(db, blueprint, "blueprint");
  await paidOrder(db, accel, "accelerator");
  await paidOrder(db, accel2, "accelerator");
  await db.query("insert into public.user_roles (user_id, role) values ($1, 'coach')", [coach]);
  const s = await db.query<{ id: string }>(
    "insert into public.coaching_sessions (kind, title, starts_at, ends_at, meeting_url_private, published) values ('group', 'Weekly coaching', now() + interval '2 days', now() + interval '2 days 1 hour', 'https://zoom.example/j/123', true) returning id",
  );
  sessionId = s.rows[0]!.id;
});
afterAll(async () => {
  await db.end();
});

async function as(userId: string, sql: string, params: unknown[] = []) {
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

describe("coaching hub", () => {
  it("only coaching members see sessions and private links; Blueprint does not", async () => {
    const seen = await asUser(db, accel, (q) => q("select meeting_url_private from public.coaching_sessions where id = $1", [sessionId]));
    expect(seen).toEqual([{ meeting_url_private: "https://zoom.example/j/123" }]);
    expect(await asUser(db, blueprint, (q) => q("select id from public.coaching_sessions"))).toHaveLength(0);
    expect(await asUser(db, null, (q) => q("select id from public.coaching_sessions"))).toHaveLength(0);
  });
  it("members ask advance questions for upcoming sessions; Blueprint cannot", async () => {
    expect(await as(accel, "insert into public.coaching_questions (session_id, user_id, body) values ($1, $2, 'How do I price?') returning id", [sessionId, accel])).toHaveLength(1);
    await expectDenied(db, blueprint, "insert into public.coaching_questions (session_id, user_id, body) values ($1, $2, 'Can I join?')", [sessionId, blueprint]);
    expect(await asUser(db, accel2, (q) => q("select id from public.coaching_questions"))).toHaveLength(0);
  });
  it("coaches manage sessions; students cannot", async () => {
    const changed = await asUser(db, accel, (q) => q("update public.coaching_sessions set meeting_url_private = 'https://evil.example' where id = $1 returning id", [sessionId]));
    expect(changed).toHaveLength(0);
    expect(await as(coach, "update public.coaching_sessions set agenda = 'Pricing Q&A' where id = $1 returning id", [sessionId])).toHaveLength(1);
  });
  it("replays disappear when coaching ends (6 months)", async () => {
    const u = await createUser(db, "expired");
    await paidOrder(db, u, "accelerator", { firstPaidAt: addDays(new Date(), -200) });
    expect(await asUser(db, u, (q) => q("select id from public.coaching_sessions"))).toHaveLength(0);
  });
});

describe("workshops", () => {
  it("only released, published workshops are visible to coaching members", async () => {
    await db.query(`insert into public.workshops (slug, title, release_at, status, is_sample) values
      ('sample-released', 'SAMPLE: Released workshop', now() - interval '1 day', 'published', true),
      ('sample-future', 'SAMPLE: Future workshop', now() + interval '10 days', 'published', true),
      ('sample-draft-ws', 'SAMPLE: Draft workshop', now() - interval '1 day', 'draft', true)`);
    const rows = await asUser(db, accel, (q) => q<{ slug: string }>("select slug from public.workshops where slug like 'sample-%'"));
    expect(rows.map((r) => r.slug)).toEqual(["sample-released"]);
    expect(await asUser(db, blueprint, (q) => q("select id from public.workshops"))).toHaveLength(0);
  });
});

describe("Hot Seat", () => {
  it("closes at 1 PM Eastern on the first Tuesday", async () => {
    const { rows } = await db.query("select app.hotseat_close('2027-02-01') as feb, app.hotseat_close('2027-06-01') as jun");
    expect(new Date(rows[0].feb).toISOString()).toBe("2027-02-02T18:00:00.000Z");
    expect(new Date(rows[0].jun).toISOString()).toBe("2027-06-01T17:00:00.000Z");
  });
  it("requires recording consent and the hotseat feature, one application per month", async () => {
    const month = "2099-01-01";
    await expectDenied(db, accel, "insert into public.hotseat_applications (user_id, target_month, topic, details, recording_consent, consent_text_version) values ($1, $2, 'Pricing', 'Details about my pricing question', false, 'v1')", [accel, month]);
    await expectDenied(db, blueprint, "insert into public.hotseat_applications (user_id, target_month, topic, details, recording_consent, consent_text_version) values ($1, $2, 'Pricing', 'Details about my pricing question', true, 'v1')", [blueprint, month]);
    const ok = await as(accel, "insert into public.hotseat_applications (user_id, target_month, topic, details, recording_consent, consent_text_version) values ($1, $2, 'Pricing', 'Details about my pricing question', true, 'v1') returning id", [accel, month]);
    expect(ok).toHaveLength(1);
    await expectDenied(db, accel, "insert into public.hotseat_applications (user_id, target_month, topic, details, recording_consent, consent_text_version) values ($1, $2, 'Again', 'Second application same month', true, 'v1')", [accel, month]);
    await expectDenied(db, accel, "update public.hotseat_applications set status = 'selected' where id = $1", [ok[0].id]);
    expect(await as(accel, "update public.hotseat_applications set status = 'withdrawn' where id = $1 returning status", [ok[0].id])).toEqual([{ status: "withdrawn" }]);
  });
  it("refuses applications after the close", async () => {
    await expectDenied(db, accel, "insert into public.hotseat_applications (user_id, target_month, topic, details, recording_consent, consent_text_version) values ($1, '2020-01-01', 'Late', 'This is too late to apply', true, 'v1')", [accel]);
  });
  it("staff carry an unselected application into next month", async () => {
    const a = await db.query<{ id: string }>("insert into public.hotseat_applications (user_id, target_month, topic, details, recording_consent, consent_text_version) values ($1, '2099-03-01', 'Launch', 'Help me plan my launch', true, 'v1') returning id", [accel2]);
    const r = await as(coach, "select public.staff_carry_forward_hotseat($1) as id", [a.rows[0]!.id]);
    const next = await db.query("select target_month::text, status, carried_from from public.hotseat_applications where id = $1", [r[0].id]);
    expect(next.rows[0]).toEqual({ target_month: "2099-04-01", status: "submitted", carried_from: a.rows[0]!.id });
    await expectDenied(db, accel2, "select public.staff_carry_forward_hotseat($1)", [a.rows[0]!.id]);
  });
});

describe("feedback quota (D11)", () => {
  const submit = (u: string, title: string) =>
    as(u, "insert into public.feedback_submissions (user_id, cycle_start, deliverable_title, description, response_due_at) values ($1, now(), $2, 'Please review my sales page', now() + interval '3 days') returning id, cycle_start", [u, title]);

  it("allows two per cycle and refuses the third, server side", async () => {
    const u = await createUser(db, "fb");
    await paidOrder(db, u, "accelerator", { firstPaidAt: addDays(new Date(), -10) });
    await submit(u, "Sales page");
    await submit(u, "Opt in page");
    await expect(submit(u, "Third")).rejects.toThrow(/quota reached/);
  });
  it("a withdrawn submission frees its slot; responses cannot be forged by members", async () => {
    const u = await createUser(db, "fb2");
    await paidOrder(db, u, "accelerator", { firstPaidAt: addDays(new Date(), -3) });
    const [a] = await submit(u, "First");
    await submit(u, "Second");
    await expect(as(u, "update public.feedback_submissions set response_text = 'Looks great' where id = $1", [a.id])).rejects.toThrow(/withdraw/);
    await as(u, "update public.feedback_submissions set state = 'withdrawn' where id = $1", [a.id]);
    expect(await submit(u, "Replacement")).toHaveLength(1);
  });
  it("cycles start at coaching activation and repeat monthly; unused submissions do not roll over", async () => {
    const u = await createUser(db, "fb3");
    const activation = addDays(new Date(), -40);
    await paidOrder(db, u, "accelerator", { firstPaidAt: activation });
    const { rows } = await db.query("select app.feedback_cycle_start($1, now()) as cs", [u]);
    const cs = new Date(rows[0].cs);
    expect(cs.getTime()).toBeGreaterThan(activation.getTime());
    expect(cs.getTime()).toBeLessThanOrEqual(Date.now());
    // Nothing was used last cycle; this cycle still allows exactly two.
    await submit(u, "One");
    await submit(u, "Two");
    await expect(submit(u, "Three")).rejects.toThrow(/quota reached/);
  });
  it("Blueprint and graduate members have no feedback allowance", async () => {
    await expectDenied(db, blueprint, "insert into public.feedback_submissions (user_id, cycle_start, deliverable_title, description, response_due_at) values ($1, now(), 'Page', 'Please review this', now())", [blueprint]);
  });
  it("other members cannot read a submission; an assigned coach can respond", async () => {
    const u = await createUser(db, "fb4");
    await paidOrder(db, u, "accelerator");
    const [s] = await submit(u, "Private work");
    expect(await asUser(db, accel, (q) => q("select id from public.feedback_submissions where id = $1", [s.id]))).toHaveLength(0);
    expect(await asUser(db, coach, (q) => q("select id from public.feedback_submissions where id = $1", [s.id]))).toHaveLength(0);
    await db.query("insert into public.coach_assignments (coach_id, student_id) values ($1, $2)", [coach, u]);
    const r = await as(coach, "update public.feedback_submissions set state = 'responded', response_text = 'Strong headline. Tighten the offer.', responder_id = $2 where id = $1 returning responded_at", [s.id, coach]);
    expect(r[0].responded_at).not.toBeNull();
  });
});

describe("community (D10)", () => {
  it("coaching members post and comment; Blueprint cannot see or post", async () => {
    const [p] = await as(accel, "insert into public.community_posts (user_id, title, body, tag) values ($1, 'First win', 'I launched my opt in page', 'win') returning id", [accel]);
    expect(await asUser(db, accel2, (q) => q("select id from public.community_posts where id = $1", [p.id]))).toHaveLength(1);
    expect(await asUser(db, blueprint, (q) => q("select id from public.community_posts"))).toHaveLength(0);
    await expectDenied(db, blueprint, "insert into public.community_posts (user_id, title, body) values ($1, 'Hello', 'Can I post?')", [blueprint]);
    expect(await as(accel2, "insert into public.community_comments (post_id, user_id, body) values ($1, $2, 'Congratulations') returning id", [p.id, accel2])).toHaveLength(1);
  });
  it("members cannot pin, announce, or moderate; staff can hide", async () => {
    await expectDenied(db, accel, "insert into public.community_posts (user_id, title, body, pinned) values ($1, 'Pin me', 'Pinned post', true)", [accel]);
    await expectDenied(db, accel, "insert into public.community_posts (user_id, title, body, tag) values ($1, 'News', 'Announcement', 'announcement')", [accel]);
    const [p] = await as(accel2, "insert into public.community_posts (user_id, title, body) values ($1, 'Spam', 'Buy my thing') returning id", [accel2]);
    await expectDenied(db, accel2, "update public.community_posts set moderation_status = 'visible', pinned = true where id = $1", [p.id]);
    await as(accel, "insert into public.community_reports (reporter_id, post_id, reason) values ($1, $2, 'Spam')", [accel, p.id]);
    await as(coach, "update public.community_posts set moderation_status = 'hidden' where id = $1", [p.id]);
    expect(await asUser(db, accel, (q) => q("select id from public.community_posts where id = $1", [p.id]))).toHaveLength(0);
    expect(await asUser(db, accel2, (q) => q("select id from public.community_posts where id = $1", [p.id]))).toHaveLength(1); // author still sees own
  });
  it("rate limits posting", async () => {
    const u = await createUser(db, "spammer");
    await paidOrder(db, u, "accelerator");
    for (let i = 0; i < 5; i++) await as(u, "insert into public.community_posts (user_id, title, body) values ($1, $2, 'Post body here')", [u, `Post ${i}`]);
    await expect(as(u, "insert into public.community_posts (user_id, title, body) values ($1, 'Six', 'Post body here')", [u])).rejects.toThrow(/limit reached/);
  });
  it("author names are available to members; emails never are", async () => {
    const rows = await asUser(db, accel2, (q) => q("select * from public.community_authors($1)", [[accel, accel2]]));
    expect(rows.length).toBe(2);
    expect(JSON.stringify(rows)).not.toMatch(/@/);
    expect(await asUser(db, blueprint, (q) => q("select * from public.community_authors($1)", [[accel]]))).toHaveLength(0);
  });
});
