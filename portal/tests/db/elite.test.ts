import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { addDays, addMonths, asUser, connect, createUser, expectDenied, paidOrder } from "./helpers";

let db: Client;
let a: string; // Elite client A
let b: string; // Elite client B
let coach: string;
let boardA: string;
let boardB: string;

async function as(userId: string | null, sql: string, params: unknown[] = []) {
  await db.query("begin");
  await db.query(`set local role ${userId ? "authenticated" : "anon"}`);
  await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(userId ? { sub: userId, role: "authenticated" } : { role: "anon" })]);
  try {
    const r = await db.query(sql, params);
    await db.query("commit");
    return r.rows;
  } catch (e) {
    await db.query("rollback");
    throw e;
  }
}
const board = async (u: string) => (await db.query<{ id: string }>("select id from public.elite_boards where client_id = $1", [u])).rows[0]?.id;

beforeAll(async () => {
  db = await connect();
  a = await createUser(db, "eliteA");
  b = await createUser(db, "eliteB");
  coach = await createUser(db, "elitecoach");
  await db.query("insert into public.user_roles (user_id, role) values ($1, 'coach')", [coach]);
  await paidOrder(db, a, "elite");
  await paidOrder(db, b, "elite");
  boardA = (await board(a))!;
  boardB = (await board(b))!;
  await db.query("update public.elite_boards set coach_id = $1 where id = $2", [coach, boardA]);
});
afterAll(async () => {
  await db.end();
});

describe("provisioning", () => {
  it("an Elite purchase creates the workspace and a 720 minute included allowance once", async () => {
    expect(boardA).toBeTruthy();
    const buckets = await db.query("select kind, minutes_granted from public.elite_hour_buckets where board_id = $1", [boardA]);
    expect(buckets.rows).toEqual([{ kind: "included", minutes_granted: 720 }]);
  });
});

describe("applications and the five seat cap", () => {
  it("anyone can apply; only staff decide; checkout opens for the accepted email only", async () => {
    const applicant = await createUser(db, "applicant");
    const email = (await db.query("select email from auth.users where id = $1", [applicant])).rows[0].email;
    const [r] = await as(null, "select public.submit_elite_application($1) as id", [{ name: "Ada Applicant", email, business_stage: "Blog with an ebook", goals: "Build a funnel that sells", biggest_challenge: "No time to set up email" }]);
    await expectDenied(db, applicant, "select public.staff_decide_elite($1, 'accepted', 'yes')", [r.id]);
    expect((await as(applicant, "select public.my_elite_checkout_allowed() as ok"))[0].ok).toBe(false);
    await as(coach, "select public.staff_decide_elite($1, 'accepted', 'Welcome')", [r.id]);
    expect((await as(applicant, "select public.my_elite_checkout_allowed() as ok"))[0].ok).toBe(true);
    expect((await as(a, "select public.my_elite_checkout_allowed() as ok"))[0].ok).toBe(false);
    expect(await asUser(db, b, (q) => q("select id from public.elite_applications where id = $1", [r.id]))).toHaveLength(0);
  });

  it("refuses a sixth accepted seat", async () => {
    // Seats used: A and B active, plus 1 accepted offer above = 3. Accept two more, then the next must fail.
    const ids: string[] = [];
    for (let i = 0; i < 3; i++) {
      const [r] = await as(null, "select public.submit_elite_application($1) as id", [{ name: `Cap ${i}`, email: `cap${i}-${Date.now()}@test.invalid`, business_stage: "Growing blog", goals: "Automate my email", biggest_challenge: "Everything is manual" }]);
      ids.push(r.id);
    }
    await as(coach, "select public.staff_decide_elite($1, 'accepted', null)", [ids[0]]);
    await as(coach, "select public.staff_decide_elite($1, 'accepted', null)", [ids[1]]);
    await expect(as(coach, "select public.staff_decide_elite($1, 'accepted', null)", [ids[2]])).rejects.toThrow(/five Elite seats/);
    const cap = await as(coach, "select * from public.elite_capacity()");
    expect(cap[0]).toEqual({ seats_total: 5, seats_used: 5 });
  });

  it("rate limits repeated applications from one email", async () => {
    const email = `repeat-${Date.now()}@test.invalid`;
    const p = { name: "Repeat", email, business_stage: "Stage", goals: "Goals for my business", biggest_challenge: "A real challenge here" };
    await as(null, "select public.submit_elite_application($1)", [p]);
    await as(null, "select public.submit_elite_application($1)", [p]);
    await expect(as(null, "select public.submit_elite_application($1)", [p])).rejects.toThrow(/already being reviewed/);
  });
});

describe("workspace isolation", () => {
  it("client A cannot see client B's board, items, files, sessions, or hours", async () => {
    await db.query("insert into public.elite_items (board_id, kind, title, created_by) values ($1, 'task', 'B private task', $2)", [boardB, b]);
    expect(await asUser(db, a, (q) => q("select id from public.elite_boards where id = $1", [boardB]))).toHaveLength(0);
    expect(await asUser(db, a, (q) => q("select id from public.elite_items where board_id = $1", [boardB]))).toHaveLength(0);
    expect(await asUser(db, a, (q) => q("select * from public.elite_hours_summary($1)", [boardB]))).toHaveLength(0);
    await expectDenied(db, a, "insert into public.elite_items (board_id, kind, title, status, created_by) values ($1, 'request', 'Sneaky', 'submitted', $2)", [boardB, a]);
  });

  it("a coach sees only boards assigned to them", async () => {
    expect(await asUser(db, coach, (q) => q("select id from public.elite_boards where id = $1", [boardA]))).toHaveLength(1);
    expect(await asUser(db, coach, (q) => q("select id from public.elite_boards where id = $1", [boardB]))).toHaveLength(0);
    await expectDenied(db, coach, "insert into public.elite_items (board_id, kind, title, created_by) values ($1, 'coach_note', 'note', $2)", [boardB, coach]);
  });

  it("coach notes are never visible to the client", async () => {
    await as(coach, "insert into public.elite_items (board_id, kind, title, body, created_by) values ($1, 'coach_note', 'Private', 'Coach only thoughts', $2)", [boardA, coach]);
    await as(coach, "insert into public.elite_items (board_id, kind, title, month_number, created_by) values ($1, 'roadmap', 'Month 1 focus', 1, $2)", [boardA, coach]);
    const seen = await asUser(db, a, (q) => q<{ kind: string }>("select kind from public.elite_items where board_id = $1", [boardA]));
    expect(seen.map((r) => r.kind)).toContain("roadmap");
    expect(seen.map((r) => r.kind)).not.toContain("coach_note");
  });

  it("clients cannot move a task to another board", async () => {
    const [t] = await as(a, "insert into public.elite_items (board_id, kind, title, created_by) values ($1, 'task', 'My task', $2) returning id", [boardA, a]);
    await expectDenied(db, a, "update public.elite_items set board_id = $1 where id = $2", [boardB, t.id]);
  });
});

describe("DFY minute ledger (D12)", () => {
  it("never exceeds 720 included minutes; overage needs a package; entries cannot be edited", async () => {
    const bucket = (await db.query("select id from public.elite_hour_buckets where board_id = $1 and kind = 'included'", [boardA])).rows[0].id;
    const [req] = await as(a, "insert into public.elite_items (board_id, kind, title, status, created_by) values ($1, 'request', 'Set up email automation', 'submitted', $2) returning id", [boardA, a]);
    const today = new Date().toISOString().slice(0, 10);
    await as(coach, "insert into public.elite_time_entries (board_id, bucket_id, item_id, minutes, work_date, note, coach_id) values ($1, $2, $3, 600, $4, 'Built welcome sequence', $5)", [boardA, bucket, req.id, today, coach]);
    await as(coach, "insert into public.elite_time_entries (board_id, bucket_id, item_id, minutes, work_date, note, coach_id) values ($1, $2, $3, 120, $4, 'Tested automations', $5)", [boardA, bucket, req.id, today, coach]);
    await expect(as(coach, "insert into public.elite_time_entries (board_id, bucket_id, minutes, work_date, note, coach_id) values ($1, $2, 1, $3, 'One more minute', $4)", [boardA, bucket, today, coach])).rejects.toThrow(/Not enough minutes remaining/);
    const [sum] = await as(a, "select minutes_granted, minutes_used from public.elite_hours_summary($1)", [boardA]);
    expect(sum).toEqual({ minutes_granted: 720, minutes_used: 720 });
    await expectDenied(db, a, "insert into public.elite_time_entries (board_id, bucket_id, minutes, work_date, note, coach_id) values ($1, $2, 5, $3, 'Client entry', $4)", [boardA, bucket, today, a]);
    const entry = (await db.query("select id from public.elite_time_entries where bucket_id = $1 limit 1", [bucket])).rows[0].id;
    await expect(db.query("update public.elite_time_entries set minutes = 1 where id = $1", [entry])).rejects.toThrow(/cannot be edited/);
  });

  it("packages are recorded by admins with a note; expired allowances refuse new time", async () => {
    const admin = await createUser(db, "eliteadmin");
    await db.query("insert into public.user_roles (user_id, role) values ($1, 'admin')", [admin]);
    await expectDenied(db, coach, "insert into public.elite_hour_buckets (board_id, kind, minutes_granted, expires_at, note) values ($1, 'package', 180, now() + interval '3 months', 'Three hour package')", [boardA]);
    const [pkg] = await as(admin, "insert into public.elite_hour_buckets (board_id, kind, minutes_granted, expires_at, note, created_by) values ($1, 'package', 180, now() + interval '3 months', 'Three hour package, invoice 1001', $2) returning id", [boardA, admin]);
    const today = new Date().toISOString().slice(0, 10);
    await as(coach, "insert into public.elite_time_entries (board_id, bucket_id, minutes, work_date, note, coach_id) values ($1, $2, 60, $3, 'Package work', $4)", [boardA, pkg.id, today, coach]);
    const old = await db.query<{ id: string }>("insert into public.elite_hour_buckets (board_id, kind, minutes_granted, starts_at, expires_at, note) values ($1, 'package', 60, now() - interval '5 months', now() - interval '2 months', 'Expired package test') returning id", [boardA]);
    await expect(as(coach, "insert into public.elite_time_entries (board_id, bucket_id, minutes, work_date, note, coach_id) values ($1, $2, 10, $3, 'Late work', $4)", [boardA, old.rows[0]!.id, today, coach])).rejects.toThrow(/expired/);
  });
});

describe("I-11: hours only mode during the 30 day extension", () => {
  it("after coaching ends the client keeps requests and hours, not the roadmap or sessions", async () => {
    const c = await createUser(db, "extension");
    await paidOrder(db, c, "elite", { firstPaidAt: addDays(addMonths(new Date(), -6), -5) });
    const bd = (await board(c))!;
    await db.query("insert into public.elite_items (board_id, kind, title, created_by) values ($1, 'roadmap', 'Month 6', $2), ($1, 'request', 'Fix checkout', $2)", [bd, c]);
    const items = await asUser(db, c, (q) => q<{ kind: string }>("select kind from public.elite_items where board_id = $1", [bd]));
    expect(items.map((i) => i.kind)).toEqual(["request"]);
    expect(await asUser(db, c, (q) => q("select * from public.elite_hours_summary($1)", [bd]))).toHaveLength(1);
    expect(await as(c, "insert into public.elite_items (board_id, kind, title, status, created_by) values ($1, 'request', 'One more fix', 'submitted', $2) returning id", [bd, c])).toHaveLength(1);
    await expectDenied(db, c, "insert into public.elite_items (board_id, kind, title, created_by) values ($1, 'task', 'Task', $2)", [bd, c]);
  });
});

describe("private sessions and check-ins", () => {
  it("cancelling 24 hours ahead is a reschedule; later is forfeited; check-in due 24 hours before", async () => {
    const [early] = await as(coach, "insert into public.elite_sessions (board_id, starts_at, ends_at) values ($1, now() + interval '3 days', now() + interval '3 days 1 hour') returning id", [boardA]);
    const [late] = await as(coach, "insert into public.elite_sessions (board_id, starts_at, ends_at) values ($1, now() + interval '5 hours', now() + interval '6 hours') returning id", [boardA]);
    expect((await as(a, "select public.client_cancel_private_session($1) as s", [early.id]))[0].s).toBe("client_rescheduled");
    expect((await as(a, "select public.client_cancel_private_session($1) as s", [late.id]))[0].s).toBe("late_cancel_forfeited");
    await expectDenied(db, b, "select public.client_cancel_private_session($1)", [early.id]);

    const [next] = await as(coach, "insert into public.elite_sessions (board_id, starts_at, ends_at) values ($1, now() + interval '4 days', now() + interval '4 days 1 hour') returning id, starts_at", [boardA]);
    const [ci] = await as(a, "insert into public.elite_checkins (board_id, session_id, accomplishments, challenges, top_priorities, help_needed) values ($1, $2, 'Shipped page', 'Time', '1. Email 2. Pins 3. Offer', 'Review my sequence') returning due_at", [boardA, next.id]);
    expect(new Date(ci.due_at).getTime()).toBe(new Date(next.starts_at).getTime() - 24 * 3600 * 1000);
    expect(await asUser(db, b, (q) => q("select id from public.elite_checkins where board_id = $1", [boardA]))).toHaveLength(0);
  });
});

describe("I-54: Claude board link", () => {
  const url = "https://claude.ai/artifact/0f6c1a2b-3c4d-4e5f-8a9b-0c1d2e3f4a5b";
  it("the assigned coach or an admin sets it; the client reads only their own; others cannot set it", async () => {
    await as(coach, "select public.staff_set_claude_board($1, $2)", [boardA, url]);
    expect((await as(a, "select claude_board_url from public.elite_boards where id = $1", [boardA]))[0].claude_board_url).toBe(url);
    expect(await as(b, "select claude_board_url from public.elite_boards where id = $1", [boardA])).toHaveLength(0);
    await expectDenied(db, a, "select public.staff_set_claude_board($1, $2)", [boardA, "https://claude.ai/artifact/mine"]);
    await expectDenied(db, coach, "select public.staff_set_claude_board($1, $2)", [boardB, url]);
    await expectDenied(db, null, "select public.staff_set_claude_board($1, $2)", [boardA, url]);
    const admin = await createUser(db, "cbadmin");
    await db.query("insert into public.user_roles (user_id, role) values ($1, 'admin')", [admin]);
    await as(admin, "select public.staff_set_claude_board($1, $2)", [boardB, url]);
    expect((await db.query("select claude_board_url from public.elite_boards where id = $1", [boardB])).rows[0].claude_board_url).toBe(url);
  });
  it("accepts only claude.ai links, clears on empty, and audits every change", async () => {
    for (const bad of ["http://claude.ai/x", "https://evil.example/claude.ai/", "https://claude.ai.evil.example/x", "javascript:alert(1)", "https://claude.ai/x y"]) {
      await expect(as(coach, "select public.staff_set_claude_board($1, $2)", [boardA, bad])).rejects.toThrow();
    }
    await as(coach, "select public.staff_set_claude_board($1, $2)", [boardA, "  "]);
    expect((await db.query("select claude_board_url from public.elite_boards where id = $1", [boardA])).rows[0].claude_board_url).toBeNull();
    const log = await db.query("select action, actor_id from public.admin_audit_log where entity_type = 'elite_board' and entity_id = $1 order by created_at", [boardA]);
    expect(log.rows.map((r) => r.action)).toEqual(["elite_board.claude_link_set", "elite_board.claude_link_removed"]);
    expect(log.rows.every((r) => r.actor_id === coach)).toBe(true);
    await expect(db.query("update public.elite_boards set claude_board_url = 'https://example.com' where id = $1", [boardA])).rejects.toThrow(/check/);
  });
});
