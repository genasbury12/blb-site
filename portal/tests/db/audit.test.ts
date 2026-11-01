import { readFileSync } from "node:fs";
import path from "node:path";
import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, connect, createUser, expectDenied, paidOrder } from "./helpers";

let db: Client;
let student: string;
let other: string;
let versionId: string;

beforeAll(async () => {
  db = await connect();
  student = await createUser(db, "auditor");
  other = await createUser(db, "neighbor");
  await paidOrder(db, student, "accelerator");
  await paidOrder(db, other, "accelerator");
  const { rows } = await db.query<{ id: string }>("select id from public.audit_versions where version_number = 1");
  versionId = rows[0]!.id;
});
afterAll(async () => {
  await db.end();
});

describe("canonical audit v1", () => {
  it("database questions match the versioned source file exactly", async () => {
    const source = JSON.parse(readFileSync(path.resolve(__dirname, "../../src/domain/audit/v1.questions.json"), "utf8"));
    const { rows } = await db.query(
      "select question_code as code, number, category_code as category, prompt, options_json as options from public.audit_questions where version_id = $1 order by number",
      [versionId],
    );
    expect(rows).toEqual(source.questions);
  });
  it("published questions cannot be edited", async () => {
    await expect(db.query("update public.audit_questions set prompt = 'x' where version_id = $1", [versionId])).rejects.toThrow(/cannot change/);
  });
});

describe("drafts", () => {
  it("students save and resume their own draft", async () => {
    await db.query("begin");
    await db.query("set local role authenticated");
    await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: student, role: "authenticated" })]);
    await db.query("insert into public.audit_drafts (user_id, version_id, answers_json, current_question) values ($1, $2, $3, 3)", [
      student,
      versionId,
      JSON.stringify({ Q1: "B", Q2: "C" }),
    ]);
    await db.query("commit");
    const rows = await asUser(db, student, (q) => q("select answers_json, current_question from public.audit_drafts where user_id = $1", [student]));
    expect(rows).toEqual([{ answers_json: { Q1: "B", Q2: "C" }, current_question: 3 }]);
  });
  it("rejects invalid answers", async () => {
    await expectDenied(db, other, "insert into public.audit_drafts (user_id, version_id, answers_json) values ($1, $2, $3)", [
      other,
      versionId,
      JSON.stringify({ Q1: "N/A" }),
    ]);
  });
  it("cannot read or write another student's draft", async () => {
    const rows = await asUser(db, other, (q) => q("select * from public.audit_drafts where user_id = $1", [student]));
    expect(rows).toHaveLength(0);
    await expectDenied(db, other, "insert into public.audit_drafts (user_id, version_id) values ($1, $2)", [student, versionId]);
  });
  it("requires an audit entitlement", async () => {
    const stranger = await createUser(db, "stranger");
    await expectDenied(db, stranger, "insert into public.audit_drafts (user_id, version_id) values ($1, $2)", [stranger, versionId]);
  });
});

describe("runs", () => {
  it("clients cannot insert scored runs (scores cannot be forged)", async () => {
    await expectDenied(
      db,
      student,
      `insert into public.audit_runs (user_id, version_id, scoring_version, answers_snapshot_json, category_scores_json, overall_score, assigned_path, recommendation_snapshot_json)
       values ($1, $2, 'v1', '{}', '{}', 100, 'optimize_automate', '{}')`,
      [student, versionId],
    );
  });
  it("runs are immutable, private, and visible to an assigned coach only", async () => {
    const { rows } = await db.query<{ id: string }>(
      `insert into public.audit_runs (user_id, version_id, scoring_version, answers_snapshot_json, category_scores_json, overall_score, assigned_path, recommendation_snapshot_json)
       values ($1, $2, 'audit-v1/engine-1', '{"Q1":"A"}', '{}', 10, 'build_from_scratch', '{}') returning id`,
      [student, versionId],
    );
    const runId = rows[0]!.id;
    await expect(db.query("update public.audit_runs set overall_score = 99 where id = $1", [runId])).rejects.toThrow(/append only/);
    expect(await asUser(db, other, (q) => q("select id from public.audit_runs where id = $1", [runId]))).toHaveLength(0);

    const coach = await createUser(db, "coach");
    await db.query("insert into public.user_roles (user_id, role) values ($1, 'coach')", [coach]);
    expect(await asUser(db, coach, (q) => q("select id from public.audit_runs where id = $1", [runId]))).toHaveLength(0);
    await db.query("insert into public.coach_assignments (coach_id, student_id) values ($1, $2)", [coach, student]);
    expect(await asUser(db, coach, (q) => q("select id from public.audit_runs where id = $1", [runId]))).toHaveLength(1);
  });
  it("students record a path override for their own run only", async () => {
    const { rows } = await db.query<{ id: string }>("select id from public.audit_runs where user_id = $1 limit 1", [student]);
    const runId = rows[0]!.id;
    const ok = await asUser(db, student, (q) =>
      q("insert into public.path_overrides (user_id, audit_run_id, chosen_path, reason, actor_id) values ($1, $2, 'optimize_automate', 'I already have a site', $1) returning chosen_path", [student, runId]),
    );
    expect(ok).toEqual([{ chosen_path: "optimize_automate" }]);
    await expectDenied(db, other, "insert into public.path_overrides (user_id, audit_run_id, chosen_path, actor_id) values ($1, $2, 'build_from_scratch', $1)", [other, runId]);
  });
});

describe("atomic submission", () => {
  it("only the service role can record a submission, and it writes run, roadmap, and consumes the draft together", async () => {
    const learner = await createUser(db, "submitter");
    await paidOrder(db, learner, "blueprint");
    const draft = await db.query<{ id: string }>(
      "insert into public.audit_drafts (user_id, version_id, answers_json) values ($1, $2, '{\"Q1\":\"A\"}') returning id",
      [learner, versionId],
    );
    const run = {
      user_id: learner, version_id: versionId, scoring_version: "audit-v1/engine-1.0.0", answers_snapshot_json: { Q1: "A" },
      category_scores_json: {}, overall_score: 12.5, assigned_path: "build_from_scratch", recommendation_snapshot_json: {},
    };
    const roadmap = [{ month_number: 1, priority_order: 1, title: "Work through Module 1", reason: "r", recommended_module_number: 1, recommended_lesson_id: null }];

    await expectDenied(db, learner, "select public.record_audit_submission($1, $2, $3)", [run, JSON.stringify(roadmap), draft.rows[0]!.id]);

    await db.query("begin");
    await db.query("set local role service_role");
    const { rows } = await db.query<{ id: string }>("select public.record_audit_submission($1, $2, $3) as id", [run, JSON.stringify(roadmap), draft.rows[0]!.id]);
    await db.query("commit");
    const runId = rows[0]!.id;
    const items = await db.query("select count(*)::int as n from public.roadmap_items where source_audit_run_id = $1", [runId]);
    expect(items.rows[0].n).toBe(1);
    const drafts = await db.query("select count(*)::int as n from public.audit_drafts where user_id = $1", [learner]);
    expect(drafts.rows[0].n).toBe(0);
    const profile = await db.query("select onboarding_state from public.profiles where user_id = $1", [learner]);
    expect(profile.rows[0].onboarding_state).toBe("audit_completed");
  });

  it("rolls back everything when any part fails", async () => {
    const learner = await createUser(db, "rollback");
    await paidOrder(db, learner, "blueprint");
    const run = {
      user_id: learner, version_id: versionId, scoring_version: "x", answers_snapshot_json: { Q1: "A" },
      category_scores_json: {}, overall_score: 1, assigned_path: "build_from_scratch", recommendation_snapshot_json: {},
    };
    const badRoadmap = [{ month_number: 9, priority_order: 1, title: "Invalid month", reason: "r" }];
    await db.query("begin");
    await db.query("set local role service_role");
    await expect(db.query("select public.record_audit_submission($1, $2, gen_random_uuid())", [run, JSON.stringify(badRoadmap)])).rejects.toThrow();
    await db.query("rollback");
    const runs = await db.query("select count(*)::int as n from public.audit_runs where user_id = $1", [learner]);
    expect(runs.rows[0].n).toBe(0);
  });

  it("a retake leaves earlier runs, lesson progress, and roadmap items untouched", async () => {
    const learner = await createUser(db, "retake");
    await paidOrder(db, learner, "blueprint");
    const lesson = await db.query<{ id: string }>("select id from public.lessons where status = 'published' limit 1");
    await db.query("insert into public.lesson_progress (user_id, lesson_id) values ($1, $2)", [learner, lesson.rows[0]!.id]);
    const mk = (score: number) => ({
      user_id: learner, version_id: versionId, scoring_version: "audit-v1/engine-1.0.0", answers_snapshot_json: { Q1: "A" },
      category_scores_json: {}, overall_score: score, assigned_path: "build_from_scratch", recommendation_snapshot_json: {},
    });
    const roadmap = JSON.stringify([{ month_number: 1, priority_order: 1, title: "Work through Module 1", reason: "r" }]);
    await db.query("set role service_role");
    const first = await db.query<{ id: string }>("select public.record_audit_submission($1, $2, gen_random_uuid()) as id", [mk(10), roadmap]);
    await db.query("reset role");
    await db.query("update public.roadmap_items set state = 'done', completed_at = now() where source_audit_run_id = $1", [first.rows[0]!.id]);
    await db.query("set role service_role");
    await db.query("select public.record_audit_submission($1, $2, gen_random_uuid())", [mk(60), roadmap]);
    await db.query("reset role");

    const runs = await db.query("select overall_score::float as s from public.audit_runs where user_id = $1 order by submitted_at", [learner]);
    expect(runs.rows.map((r) => r.s)).toEqual([10, 60]);
    const progress = await db.query("select count(*)::int as n from public.lesson_progress where user_id = $1", [learner]);
    expect(progress.rows[0].n).toBe(1);
    const done = await db.query("select count(*)::int as n from public.roadmap_items where user_id = $1 and state = 'done'", [learner]);
    expect(done.rows[0].n).toBe(1);
  });
});
