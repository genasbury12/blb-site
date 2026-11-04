import { describe, expect, it } from "vitest";
import l1 from "./fixtures/m1-l1-starting-point.json";
import l2 from "./fixtures/m1-l2-business-direction.json";
import {
  answerText,
  concreteFields,
  findField,
  isRequired,
  labelFrom,
  parseWorksheetSchema,
  renderSentence,
  validateAnswersPatch,
  WorksheetAnswerError,
  worksheetProgress,
} from "./schema";

const s1 = parseWorksheetSchema(l1);
const s2 = parseWorksheetSchema(l2);

describe("worksheet schema", () => {
  it("parses both Module 1 worksheets", () => {
    expect(s1.sections).toHaveLength(1);
    expect(s2.sections.map((s) => s.number)).toEqual(["1", "2", "3"]);
  });
  it("expands repeat fields per idea and resolves required_for", () => {
    const keys = concreteFields(s2).map((f) => f.key);
    expect(keys).toEqual(expect.arrayContaining(["cred_A", "cred_B", "cred_C", "assume_C", "hypothesis", "review_date"]));
    expect(isRequired(findField(s2, "cred_A")!)).toBe(true);
    expect(isRequired(findField(s2, "cred_B")!)).toBe(false);
    expect(isRequired(findField(s2, "idea_A")!)).toBe(true);
  });
  it("every completion required field exists in the worksheet", () => {
    for (const s of [s1, s2]) for (const k of s.completion.required_fields) expect(findField(s, k), k).toBeDefined();
  });
  it("labels repeat columns from the idea text, else Idea A", () => {
    expect(labelFrom("idea_{k}", "A", {})).toBe("Idea A");
    expect(labelFrom("idea_{k}", "B", { idea_B: "  Meal plans  " })).toBe("Meal plans");
  });
  it("renders the hypothesis sentence", () => {
    expect(renderSentence("helps {person} solve {problem}.", { person: "moms", problem: "" })).toBe("helps moms solve [problem].");
  });
});

describe("progress", () => {
  it("counts required fields; rating needs a rating and, when required, a note", () => {
    expect(worksheetProgress(s2, {}).percent).toBe(0);
    const p = worksheetProgress(s2, { idea_A: "Meal planning", cred_A: { rating: "strong", note: "" } });
    expect(p.done).toBe(1);
    expect(p.missing).toContain("cred_A");
    expect(worksheetProgress(s2, { idea_A: "x", cred_A: { rating: "strong", note: "Ten years as a dietitian" } }).done).toBe(2);
  });
  it("reaches 100 when every required field is filled", () => {
    const rating = { rating: "uncertain", note: "Not checked yet" };
    const all = {
      idea_A: "x", cred_A: rating, need_A: rating, fit_A: rating, logic_A: rating, assume_A: "That they will pay",
      chosen: "A", hypothesis: { person: "moms", problem: "chaos", solution: "a system" }, why: "Evidence", assumption: "Price", next_step: "Talk to five", review_date: "2026-12-01",
    };
    expect(worksheetProgress(s2, all).percent).toBe(100);
    expect(worksheetProgress(s1, { q1: "a", q2: "b", q3: "c", realization: "d" }).percent).toBe(100);
  });
});

describe("validating saved answers (server trust boundary)", () => {
  it("accepts valid values and rebuilds the sentence", () => {
    const out = validateAnswersPatch(s2, { idea_A: "Meal plans", cred_A: { rating: "weak", note: "No training" }, hypothesis: { person: "parents", problem: "picky eaters", solution: "plans", _rendered: "forged" } });
    expect(out.cred_A).toEqual({ rating: "weak", note: "No training" });
    expect((out.hypothesis as Record<string, string>)._rendered).toBe("I am exploring a business that helps parents solve picky eaters through plans.");
  });
  it.each([
    [{ nope: "x" }, "Unknown field"],
    [{ idea_A: "x".repeat(161) }, "under 160"],
    [{ cred_A: { rating: "amazing", note: "" } }, "Strong, Uncertain, or Weak"],
    [{ chosen: "D" }, "Choose one"],
    [{ review_date: "next week" }, "valid date"],
    [{ idea_A: 5 }, "under"],
  ])("rejects %j", (patch, msg) => {
    expect(() => validateAnswersPatch(s2, patch)).toThrow(WorksheetAnswerError);
    expect(() => validateAnswersPatch(s2, patch)).toThrow(new RegExp(msg));
  });
  it("allows clearing a field", () => {
    expect(validateAnswersPatch(s2, { idea_B: "", chosen: "", cred_B: { rating: null, note: "" } })).toEqual({ idea_B: "", chosen: "", cred_B: { rating: null, note: "" } });
  });
  it("answerText shows ratings as the word plus note and sentences as the rendered line", () => {
    expect(answerText(findField(s2, "cred_A"), { rating: "strong", note: "Real results" }, s2)).toBe("Strong: Real results");
    expect(answerText(findField(s2, "hypothesis"), { person: "a", _rendered: "Full sentence" })).toBe("Full sentence");
  });
});
