import { describe, expect, it } from "vitest";
import { buildSubmission, currentRoadmapMonth } from "./submission";
import { AUDIT_V1 } from "./v1";

const answers = Object.fromEntries(AUDIT_V1.questions.map((q) => [q.code, q.number % 2 ? "B" : "C"]));

describe("buildSubmission", () => {
  it("produces an immutable run snapshot and roadmap rows for six months", () => {
    const { run, roadmap, result } = buildSubmission({ userId: "u1", versionId: "v1", version: AUDIT_V1, answers, catalog: [] });
    expect(run.user_id).toBe("u1");
    expect(run.answers_snapshot_json).toEqual(answers);
    expect(run.scoring_version).toBe("audit-v1/engine-1.0.0");
    expect(run.overall_score).toBeCloseTo(result.overallScore.percent, 3);
    expect(new Set(roadmap.map((r) => r.month_number))).toEqual(new Set([1, 2, 3, 4, 5, 6]));
    expect(roadmap.every((r) => r.user_id === "u1")).toBe(true);
  });

  it("does not let later mutation of the input change the snapshot", () => {
    const input = { ...answers };
    const { run } = buildSubmission({ userId: "u1", versionId: "v1", version: AUDIT_V1, answers: input, catalog: [] });
    input.Q1 = "D";
    expect(run.answers_snapshot_json.Q1).toBe("B");
  });

  it("a retake yields a new independent run without touching the earlier one", () => {
    const first = buildSubmission({ userId: "u1", versionId: "v1", version: AUDIT_V1, answers, catalog: [] });
    const second = buildSubmission({ userId: "u1", versionId: "v1", version: AUDIT_V1, answers: { ...answers, Q1: "D", Q4: "D", Q5: "D", Q15: "D" }, catalog: [] });
    expect(first.run.assigned_path).toBe("build_from_scratch");
    expect(second.run.assigned_path).toBe("optimize_automate");
    expect(first.run.answers_snapshot_json.Q1).toBe("B");
  });

  it("refuses incomplete drafts", () => {
    const partial = { ...answers };
    delete (partial as Record<string, string>).Q12;
    expect(() => buildSubmission({ userId: "u1", versionId: "v1", version: AUDIT_V1, answers: partial, catalog: [] })).toThrow(/Missing: Q12/);
  });
});

describe("currentRoadmapMonth", () => {
  const start = new Date("2027-02-15T12:00:00Z");
  it.each([
    ["2027-02-15T12:00:00Z", 1],
    ["2027-03-14T12:00:00Z", 1],
    ["2027-03-15T12:00:00Z", 2],
    ["2027-07-20T12:00:00Z", 6],
    ["2028-01-01T00:00:00Z", 6],
  ])("%s is month %i", (now, month) => expect(currentRoadmapMonth(start, new Date(now))).toBe(month));
  it("defaults to month 1 without an activation", () => expect(currentRoadmapMonth(null, new Date())).toBe(1));
});
