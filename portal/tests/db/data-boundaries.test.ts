import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, connect, createUser, expectDenied } from "./helpers";

/** 10_DATA_RIGHTS Slice D: coaches never see a member's email, never export, never see deletion requests. */
let db: Client;
let coach: string;
let admin: string;
let member: string;

beforeAll(async () => {
  db = await connect();
  [coach, admin, member] = (await Promise.all(["bd-coach", "bd-admin", "bd-member"].map((l) => createUser(db, l)))) as [string, string, string];
  await db.query("insert into public.user_roles (user_id, role) values ($1, 'coach'), ($2, 'admin')", [coach, admin]);
  await db.query(
    "insert into public.elite_applications (name, email, business_stage, goals, biggest_challenge) values ('BD Applicant', 'bd-applicant@test.invalid', 'Growing', 'More clients each month', 'Not enough time each week')",
  );
  await db.query("insert into public.deletion_requests (user_id) values ($1)", [member]);
});
afterAll(async () => {
  await db.query("delete from public.elite_applications where email = 'bd-applicant@test.invalid'");
  await db.query("delete from public.deletion_requests where user_id = $1", [member]);
  await db.end();
});

describe("coaches and member emails", () => {
  it("a coach cannot read applications directly; the coach function has every field but the email", async () => {
    expect(await asUser(db, coach, (q) => q("select email from public.elite_applications"))).toHaveLength(0);
    const rows = await asUser(db, coach, (q) => q<Record<string, unknown>>("select * from public.coach_elite_applications() where name = 'BD Applicant'"));
    expect(rows).toHaveLength(1);
    expect(Object.keys(rows[0]!)).not.toContain("email");
    expect(JSON.stringify(rows)).not.toContain("bd-applicant@test.invalid");
  });
  it("admins still read the email; members cannot use the coach function", async () => {
    expect(await asUser(db, admin, (q) => q("select email from public.elite_applications where name = 'BD Applicant'"))).toEqual([{ email: "bd-applicant@test.invalid" }]);
    expect(await asUser(db, member, (q) => q("select * from public.coach_elite_applications()"))).toHaveLength(0);
  });
  it("coaches cannot read orders (which hold emails) or deletion requests, and cannot export", async () => {
    expect(await asUser(db, coach, (q) => q("select email from public.orders"))).toHaveLength(0);
    expect(await asUser(db, coach, (q) => q("select id from public.deletion_requests"))).toHaveLength(0);
    await expectDenied(db, coach, "select public.start_data_export($1)", [member]);
    await expectDenied(db, coach, "select * from public.admin_record_deletion($1)", [member]);
  });
});
