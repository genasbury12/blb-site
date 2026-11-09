import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { connect, createUser, expectDenied } from "./helpers";

/** Migration 2700: Elite accepted from a sales call, and a whole program granted by hand. */
let db: Client;
let admin: string;
let coach: string;
let client: string;
let clientEmail: string;

/**
 * Each test runs in one transaction that is rolled back: the other Elite tests fill all five seats and count them
 * exactly, so this file frees the seats inside its transaction and leaves nothing behind. `as` runs one statement
 * as a signed in user; plain db.query runs as the test superuser for setup and checks.
 */
async function isolated(fn: (as: (userId: string | null, sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>) => Promise<void>) {
  await db.query("begin");
  try {
    await db.query("update public.elite_applications set status = 'declined', accepted_until = null where status = 'accepted'");
    await db.query("update public.entitlements set starts_at = least(starts_at, now() - interval '2 seconds'), ends_at = now() - interval '1 second' where feature_key = 'elite_coaching.access' and (ends_at is null or ends_at > now())");
    const as = async (userId: string | null, sql: string, params?: unknown[]) => {
      await db.query("savepoint s");
      try {
        await db.query(`set local role ${userId ? "authenticated" : "anon"}`);
        await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(userId ? { sub: userId, role: "authenticated" } : { role: "anon" })]);
        const rows = (await db.query(sql, params as unknown[])).rows;
        await db.query("reset role");
        await db.query("release savepoint s");
        return rows;
      } catch (err) {
        await db.query("rollback to savepoint s");
        await db.query("reset role");
        throw err;
      }
    };
    await fn(as);
  } finally {
    await db.query("rollback");
  }
}

beforeAll(async () => {
  db = await connect();
  [admin, coach, client] = (await Promise.all(["sc-admin", "sc-coach", "sc-client"].map((l) => createUser(db, l)))) as [string, string, string];
  await db.query("insert into public.user_roles (user_id, role) values ($1, 'admin'), ($2, 'coach')", [admin, coach]);
  clientEmail = (await db.query<{ email: string }>("select lower(email) as email from auth.users where id = $1", [client])).rows[0]!.email;
});
afterAll(async () => {
  await db.end();
});

describe("Elite accepted from a sales call", () => {
  it("accepts her by name and email, opens Elite checkout for her account, logs it, and will not accept her twice", async () => {
    await isolated(async (as) => {
      const id = ((await as(admin, "select public.admin_accept_elite_from_call('Sales Call Client', $1, 'Call on Nov 9') as id", [clientEmail])) as { id: string }[])[0]!.id;
      const app = await db.query("select status, user_id, decision_note, accepted_until > now() + interval '13 days' as two_weeks from public.elite_applications where id = $1", [id]);
      expect(app.rows[0]).toMatchObject({ status: "accepted", user_id: client, decision_note: "Call on Nov 9", two_weeks: true });
      expect(await as(client, "select public.my_elite_checkout_allowed() as ok")).toEqual([{ ok: true }]);
      const log = await db.query("select actor_id, changed_fields->>'email' as email from public.admin_audit_log where action = 'elite_applications.accept_from_call' and entity_id = $1", [id]);
      expect(log.rows).toEqual([{ actor_id: admin, email: clientEmail }]);
      await expect(as(admin, "select public.admin_accept_elite_from_call('Sales Call Client', $1)", [clientEmail])).rejects.toThrow(/already accepted/);
    });
  });

  it("accepts an open application from the same email instead of adding another", async () => {
    await isolated(async (as) => {
      const email = "sc-open@test.invalid";
      await db.query(
        "insert into public.elite_applications (name, email, business_stage, goals, biggest_challenge) values ('Open One', $1, 'Growing', 'More clients each month', 'Not enough time each week')",
        [email],
      );
      await as(admin, "select public.admin_accept_elite_from_call('Open One', $1)", [email]);
      expect((await db.query("select status from public.elite_applications where email = $1", [email])).rows).toEqual([{ status: "accepted" }]);
    });
  });

  it("respects the five seat cap, and only admins can use it", async () => {
    await isolated(async (as) => {
      await db.query(
        `insert into public.elite_applications (name, email, business_stage, goals, biggest_challenge, status, accepted_until)
         select 'Seat ' || g, 'sc-seat' || g || '@test.invalid', 'Growing', 'More clients each month', 'Not enough time each week', 'accepted', now() + interval '7 days'
           from generate_series(1, 5) g`,
      );
      await expect(as(admin, "select public.admin_accept_elite_from_call('Too Many', 'sc-full@test.invalid')")).rejects.toThrow(/All five Elite seats are taken/);
    });
    await expectDenied(db, coach, "select public.admin_accept_elite_from_call('Coach Try', 'sc-coach-try@test.invalid')");
    await expectDenied(db, null, "select public.admin_accept_elite_from_call('Anon Try', 'sc-anon-try@test.invalid')");
  });
});

describe("granting a program by hand (payment collected outside the portal)", () => {
  it("Elite: every feature with purchase dates, her board and 12 hours, and her application enrolled", async () => {
    await isolated(async (as) => {
      await as(admin, "select public.admin_accept_elite_from_call('Sales Call Client', $1)", [clientEmail]);
      const n = ((await as(admin, "select public.admin_grant_program($1, 'elite', 'Paid by hand after the sales call') as n", [client])) as { n: number }[])[0]!.n;
      expect(n).toBe(12);
      const grants = await db.query<{ feature_key: string; months: number; source_type: string }>(
        "select feature_key, round(extract(epoch from (ends_at - starts_at)) / 2629800)::int as months, source_type from public.entitlements where user_id = $1 order by feature_key",
        [client],
      );
      expect(grants.rows.every((g) => g.source_type === "admin_override")).toBe(true);
      const months = Object.fromEntries(grants.rows.map((g) => [g.feature_key, g.months]));
      expect(months["curriculum.read"]).toBe(12);
      expect(months["elite_coaching.access"]).toBe(6);
      expect(months["elite_dfu_hours.use"]).toBe(7);
      const board = await db.query("select h.minutes_granted from public.elite_boards b join public.elite_hour_buckets h on h.board_id = b.id and h.kind = 'included' where b.client_id = $1", [client]);
      expect(board.rows).toEqual([{ minutes_granted: 720 }]);
      expect((await db.query("select status from public.elite_applications where email = $1", [clientEmail])).rows).toEqual([{ status: "enrolled" }]);
      const log = await db.query("select count(*)::int as n from public.admin_audit_log where actor_id = $1 and action in ('entitlement.grant', 'entitlement.grant_program')", [admin]);
      expect(log.rows[0]!.n).toBe(13);
    });
  });

  it("Blueprint: four course features for 12 months; a reason is required; admins only", async () => {
    const member = await createUser(db, "sc-blueprint");
    await isolated(async (as) => {
      await as(admin, "select public.admin_grant_program($1, 'blueprint', 'Paid by bank transfer')", [member]);
      expect((await db.query("select count(*)::int as n from public.entitlements where user_id = $1", [member])).rows[0]!.n).toBe(4);
      await expect(as(admin, "select public.admin_grant_program($1, 'blueprint', 'no')", [member])).rejects.toThrow(/reason/);
      await expect(as(admin, "select public.admin_grant_program($1, 'graduate_coaching', 'Monthly by hand')", [member])).rejects.toThrow(/Blueprint, Accelerator or Elite/);
    });
    await expectDenied(db, coach, "select public.admin_grant_program($1, 'blueprint', 'Coach tries')", [member]);
  });
});
