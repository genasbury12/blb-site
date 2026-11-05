import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, connect, createUser, expectDenied, paidOrder } from "./helpers";

/**
 * 10_DATA_RIGHTS Slice B: deletion requests and the deletion run. Every test runs in a transaction that is rolled
 * back, so each starts from the same members.
 */
let db: Client;
let member: string;
let other: string;
let coach: string;
let admin: string;
let memberEmail: string;

beforeAll(async () => {
  db = await connect();
  [member, other, coach, admin] = (await Promise.all(["del-member", "del-other", "del-coach", "del-admin"].map((l) => createUser(db, l)))) as [string, string, string, string];
  memberEmail = (await db.query("select email from auth.users where id = $1", [member])).rows[0].email;
  await db.query("insert into public.user_roles (user_id, role) values ($1, 'coach'), ($2, 'admin')", [coach, admin]);
  await db.query("insert into public.coach_assignments (coach_id, student_id) values ($1, $2)", [coach, member]);
  await paidOrder(db, member, "blueprint");
  // A path choice (append only) and audit entries that mention the member by id and email.
  await db.query("insert into public.path_overrides (user_id, chosen_path, reason, actor_id) values ($1, 'build_from_scratch', 'My reason', $1)", [member]);
  await db.query(
    `insert into public.admin_audit_log (actor_id, action, entity_type, entity_id, changed_fields, reason) values
       ($1, 'test.deletion.grant', 'user', $2, $3, 'Comp for ' || upper($4)),
       ($5, 'test.deletion.note', 'coaching_session', 'abc', '{"Note": "Unrelated MixedCase text"}', null)`,
    [admin, member, JSON.stringify({ student_id: member, email: memberEmail.toUpperCase(), Keep: "MixedCase" }), memberEmail, coach],
  );
});
afterAll(async () => {
  await db.end();
});

/** Run as the server's service role inside a transaction that is rolled back; `as` switches back to the superuser. */
async function asService<T>(fn: (q: (sql: string, p?: unknown[]) => Promise<Record<string, unknown>[]>, asSuper: () => Promise<void>) => Promise<T>) {
  await db.query("begin");
  try {
    await db.query("set local role service_role");
    const q = async (sql: string, p?: unknown[]) => (await db.query(sql, p as unknown[])).rows;
    return await fn(q, async () => {
      await db.query("reset role");
    });
  } finally {
    await db.query("rollback");
  }
}

async function requestFor(user: string): Promise<string> {
  const { rows } = await db.query("insert into public.deletion_requests (user_id) values ($1) returning id", [user]);
  return rows[0].id;
}

describe("member deletion requests", () => {
  it("a member requests, sees one open request, and can cancel it; others cannot see it", async () => {
    await asUser(db, member, async (q) => {
      const [first] = await q<{ id: string; status: string; due_at: Date; requested_at: Date }>("select * from public.request_my_deletion()");
      expect(first!.status).toBe("pending");
      expect(Math.round((first!.due_at.getTime() - first!.requested_at.getTime()) / 864e5)).toBe(30);
      const [again] = await q<{ id: string }>("select * from public.request_my_deletion()");
      expect(again!.id).toBe(first!.id);
      expect(await q("select id from public.deletion_requests")).toHaveLength(1);
      await q("select public.cancel_my_deletion()");
      expect((await q<{ status: string }>("select status from public.deletion_requests where id = $1", [first!.id]))[0]!.status).toBe("cancelled");
    });
    await expectDenied(db, member, "select public.cancel_my_deletion()");
    await expectDenied(db, null, "select * from public.request_my_deletion()");
  });

  it("other members and coaches never see a request; admins do", async () => {
    const id = await requestFor(member);
    try {
      expect(await asUser(db, other, (q) => q("select id from public.deletion_requests"))).toHaveLength(0);
      expect(await asUser(db, coach, (q) => q("select id from public.deletion_requests"))).toHaveLength(0);
      expect(await asUser(db, admin, (q) => q("select id from public.deletion_requests where id = $1", [id]))).toHaveLength(1);
    } finally {
      await db.query("delete from public.deletion_requests where id = $1", [id]);
    }
  });

  it("only the server can run a deletion: members, coaches and admins get permission denied", async () => {
    for (const who of [member, coach, admin]) await expectDenied(db, who, "select public.erase_member_prepare(gen_random_uuid(), null)");
  });
});

describe("the deletion run", () => {
  it("deletes the member's data, anonymizes what is kept, then the account itself can be deleted", async () => {
    await asService(async (q, asSuper) => {
      const id = (await q("insert into public.deletion_requests (user_id) values ($1) returning id", [member]))[0]!.id as string;
      const [res] = await q("select public.erase_member_prepare($1, null) as r", [id]);
      const r = res!.r as { user_id: string; outcome: string; token: string };
      expect(r).toMatchObject({ user_id: member, outcome: "deleted" });
      expect(r.token).toMatch(/^deleted-user-[0-9a-f]{10}$/);

      await asSuper();
      // Audit log: subject id and email replaced (any case), everything else untouched.
      const log = (await db.query("select actor_id, entity_id, changed_fields, reason from public.admin_audit_log where action = 'test.deletion.grant'")).rows[0];
      expect(log).toEqual({ actor_id: admin, entity_id: r.token, changed_fields: { student_id: r.token, email: r.token, Keep: "MixedCase" }, reason: `Comp for ${r.token}` });
      const unrelated = (await db.query("select changed_fields from public.admin_audit_log where action = 'test.deletion.note'")).rows[0];
      expect(unrelated.changed_fields).toEqual({ Note: "Unrelated MixedCase text" });
      const all = JSON.stringify((await db.query("select entity_id, changed_fields, reason from public.admin_audit_log")).rows);
      expect(all).not.toContain(member);
      expect(all.toLowerCase()).not.toContain(memberEmail.toLowerCase());
      // Purchase kept for tax and refunds, without the member.
      const order = (await db.query("select user_id, email, sku, amount_cents from public.orders where email = $1", [r.token])).rows;
      expect(order).toEqual([{ user_id: null, email: r.token, sku: "blueprint", amount_cents: 49700 }]);
      // Member data gone, including the append only path choice.
      for (const [table, col] of [["path_overrides", "user_id"], ["entitlements", "user_id"], ["profiles", "user_id"], ["coach_assignments", "student_id"]] as const)
        expect((await db.query(`select 1 from public.${table} where ${col} = $1`, [member])).rows, table).toHaveLength(0);
      // The sign in account can now be deleted (nothing points at it any more).
      await db.query("delete from auth.users where id = $1", [member]);
      await db.query("set local role service_role");
      await q("select public.erase_member_finish($1, null)", [id]);
      await asSuper();
      expect((await db.query("select status, outcome, completed_by, user_id, subject_token from public.deletion_requests where id = $1", [id])).rows[0]).toEqual({
        status: "completed",
        outcome: "deleted",
        completed_by: "schedule",
        user_id: null,
        subject_token: r.token,
      });
      const steps = (await db.query("select action, changed_fields->>'subject' as subject from public.admin_audit_log where entity_id = $1 order by id", [id])).rows;
      expect(steps).toEqual([
        { action: "deletion.started", subject: r.token },
        { action: "deletion.completed", subject: r.token },
      ]);
    });
  });

  it("community threads stay: the member's posts and replies are rewritten without an author; others' replies remain", async () => {
    await asService(async (q, asSuper) => {
      await asSuper();
      const post = (await db.query("insert into public.community_posts (user_id, title, body) values ($1, 'My pricing question', 'Private details here') returning id", [member])).rows[0].id;
      const theirs = (await db.query("insert into public.community_posts (user_id, title, body) values ($1, 'Another topic', 'Hello all') returning id", [other])).rows[0].id;
      await db.query("insert into public.community_comments (post_id, user_id, body) values ($1, $2, 'A kind reply from someone else')", [post, other]);
      await db.query("insert into public.community_comments (post_id, user_id, body) values ($1, $2, 'My reply with details')", [theirs, member]);
      await db.query("set local role service_role");
      const id = (await q("insert into public.deletion_requests (user_id) values ($1) returning id", [member]))[0]!.id as string;
      await q("select public.erase_member_prepare($1, null)", [id]);
      await asSuper();
      await db.query("delete from auth.users where id = $1", [member]);
      expect((await db.query("select user_id, title, body from public.community_posts where id = $1", [post])).rows[0]).toEqual({
        user_id: null,
        title: "Removed post",
        body: "This post was removed because the member deleted their account.",
      });
      expect((await db.query("select user_id, body from public.community_comments where post_id = $1", [post])).rows).toEqual([{ user_id: other, body: "A kind reply from someone else" }]);
      expect((await db.query("select user_id, body from public.community_comments where post_id = $1", [theirs])).rows).toEqual([
        { user_id: null, body: "This reply was removed because the member deleted their account." },
      ]);
      const left = JSON.stringify((await db.query("select title, body from public.community_posts union all select '', body from public.community_comments")).rows);
      expect(left).not.toContain("Private details");
      expect(left).not.toContain("My reply with details");
    });
  });

  it("outside a deletion run the audit log and path choices stay append only", async () => {
    await db.query("begin");
    try {
      await expect(db.query("update public.admin_audit_log set entity_id = 'x' where action = 'test.deletion.grant'")).rejects.toThrow(/append only/);
    } finally {
      await db.query("rollback");
    }
    await db.query("begin");
    try {
      await expect(db.query("delete from public.path_overrides where user_id = $1", [member])).rejects.toThrow(/append only/);
    } finally {
      await db.query("rollback");
    }
  });

  it("staff accounts are anonymized and kept: roles removed, profile replaced, sign in account left for blocking", async () => {
    await asService(async (q, asSuper) => {
      const id = (await q("insert into public.deletion_requests (user_id) values ($1) returning id", [coach]))[0]!.id as string;
      const r = (await q("select public.erase_member_prepare($1, $2) as r", [id, admin]))[0]!.r as { outcome: string; token: string };
      expect(r.outcome).toBe("anonymized");
      // Running it again (a retry) is safe and keeps the same token.
      const again = (await q("select public.erase_member_prepare($1, $2) as r", [id, admin]))[0]!.r as { token: string };
      expect(again.token).toBe(r.token);
      await asSuper();
      expect((await db.query("select role from public.user_roles where user_id = $1", [coach])).rows).toHaveLength(0);
      expect((await db.query("select display_name from public.profiles where user_id = $1", [coach])).rows[0].display_name).toBe(r.token);
      expect((await db.query("select 1 from auth.users where id = $1", [coach])).rows).toHaveLength(1);
      // The audit entry they acted in still names their (now anonymous) account.
      expect((await db.query("select actor_id from public.admin_audit_log where action = 'test.deletion.note'")).rows[0].actor_id).toBe(coach);
    });
  });

  it("a cancelled or finished request cannot be run", async () => {
    const id = (await db.query("insert into public.deletion_requests (user_id, status, cancelled_at) values ($1, 'cancelled', now()) returning id", [other])).rows[0].id;
    try {
      await db.query("begin");
      await db.query("set local role service_role");
      await expect(db.query("select public.erase_member_prepare($1, null)", [id])).rejects.toThrow(/deletion request is cancelled/);
    } finally {
      await db.query("rollback");
      await db.query("delete from public.deletion_requests where id = $1", [id]);
    }
  });
});
