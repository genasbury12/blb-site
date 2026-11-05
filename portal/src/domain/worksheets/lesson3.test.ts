import { describe, expect, it } from "vitest";
import l2 from "./fixtures/m1-l2-business-direction.json";
import l3 from "./fixtures/m1-l3-customer-research.json";
import { adminCell, adminColumns, adminCounts, worksheetCsv, type ResponseRow } from "./admin";
import { callbackSourceSlugs, fillCallbackTemplate, resolveCallbacks, type CallbackSource } from "./callbacks";
import {
  answerText,
  choiceOptions,
  concreteFields,
  expandField,
  findField,
  isRequired,
  parseWorksheetSchema,
  repeatOptions,
  rowHasContent,
  validateAnswersPatch,
  visibleRows,
  WorksheetAnswerError,
  worksheetProgress,
  type Answers,
} from "./schema";

/** 11_LESSON3_WORKSHEET: the three schema features Lessons 1 and 2 did not need, plus confidence and admin counts. */
const s2 = parseWorksheetSchema(l2);
const s3 = parseWorksheetSchema(l3);

/** The schema's own hypothetical example, with a fixed review date, as a full set of answers. */
function exampleAnswers(): Answers {
  const raw = { ...(l3.example_response as Record<string, unknown>) };
  delete raw.label;
  raw.review_date = "2026-11-15";
  return validateAnswersPatch(s3, raw);
}

describe("Lesson 3 schema", () => {
  it("parses, and its required fields and callbacks_provided keys all exist", () => {
    expect(s3.sections.map((s) => s.key)).toEqual(["evidence", "themes", "snapshot", "decision"]);
    for (const k of s3.completion.required_fields) expect(findField(s3, k), k).toBeDefined();
    // Lessons 4, 7 and 9 will quote these: the keys must stay stable.
    expect(Object.keys(s3.callbacks_provided ?? {})).toEqual(["theme_1", "theme_2", "theme_3", "snapshot", "snap_language"]);
    for (const k of Object.keys(s3.callbacks_provided ?? {})) expect(findField(s3, k), k).toBeDefined();
    expect(s3.completion.milestone_label).toBe("I built a buyer snapshot from real evidence");
    expect(s3.footer_note).toBe("You'll see your three problems again in Lesson 4, and your snapshot again in Lessons 7 and 9.");
  });

  it("expands eight observation rows, the first five required, with {k} in labels resolved", () => {
    const said = concreteFields(s3).filter((f) => f.baseKey === "ev_said_{k}");
    expect(said.map((f) => f.key)).toEqual(["ev_said_1", "ev_said_2", "ev_said_3", "ev_said_4", "ev_said_5", "ev_said_6", "ev_said_7", "ev_said_8"]);
    expect(said.map(isRequired)).toEqual([true, true, true, true, true, false, false, false]);
    expect(findField(s3, "theme_2")!.label).toBe("Problem 2");
    // Lesson 2 labels have no {k}; they are unchanged.
    expect(expandField(s2, s2.sections[0]!.fields[0]!).map((f) => f.label)).toEqual(expect.arrayContaining([s2.sections[0]!.fields[0]!.label]));
  });

  it("rejects a choice field with no options and a multichoice on a missing group", () => {
    const bad = structuredClone(l3) as typeof l3;
    (bad.sections[0]!.fields[4] as Record<string, unknown>).options_from = "nope_options";
    expect(() => parseWorksheetSchema(bad)).toThrow(/options_from/);
    const bad2 = structuredClone(l3) as typeof l3;
    (bad2.sections[1]!.fields[1] as Record<string, unknown>).options_from_repeat = "nope";
    expect(() => parseWorksheetSchema(bad2)).toThrow(/unknown repeat group/);
  });
});

describe("variable length repeat group", () => {
  it("shows five rows first, and more when a later row already has content", () => {
    expect(visibleRows(s3, "evidence", {})).toBe(5);
    expect(visibleRows(s3, "evidence", { ev_question_7: "Why?" })).toBe(7);
    expect(visibleRows(s3, "themes", {})).toBe(3);
  });

  it("a row has content when any of its five fields is filled", () => {
    expect(rowHasContent(s3, "evidence", "6", {})).toBe(false);
    expect(rowHasContent(s3, "evidence", "6", { ev_conf_6: "observed" })).toBe(true);
    expect(rowHasContent(s3, "evidence", "6", { ev_said_6: "   " })).toBe(false);
  });
});

describe("confidence choice list", () => {
  it("offers hypothesis, observed and confirmed with their guides, and validates against them", () => {
    const f = findField(s3, "ev_conf_1")!;
    if (f.type !== "choice") throw new Error("expected a choice");
    expect(choiceOptions(s3, f).map((o) => o.value)).toEqual(["hypothesis", "observed", "confirmed"]);
    expect(choiceOptions(s3, f)[2]!.guide).toBe("It keeps coming up, from different people.");
    expect(validateAnswersPatch(s3, { ev_conf_1: "confirmed" })).toEqual({ ev_conf_1: "confirmed" });
    expect(() => validateAnswersPatch(s3, { ev_conf_1: "strong" })).toThrow("Choose one of the options");
    expect(answerText(f, "observed", s3)).toBe("Observed");
  });
});

describe("multichoice from a repeat group", () => {
  it("offers only evidence rows with content, labelled with the first 60 characters of what she said", () => {
    const long = "By five I cannot make one more decision about anything at all, not even dinner.";
    const opts = repeatOptions(s3, "evidence", { ev_said_1: "Short one.", ev_source_3: "Survey, Nov 1", ev_said_4: long });
    expect(opts.map((o) => o.key)).toEqual(["1", "3", "4"]);
    expect(opts[0]!.label).toBe("Short one.");
    expect(opts[1]!.label).toBe("");
    expect(opts[2]!.label).toBe(`${long.slice(0, 60).trimEnd()}…`);
  });

  it("stores an array of keys in row order and rejects unknown, repeated or non list values", () => {
    expect(validateAnswersPatch(s3, { theme_rows_1: ["5", "1", "2"] })).toEqual({ theme_rows_1: ["1", "2", "5"] });
    expect(validateAnswersPatch(s3, { theme_rows_1: [] })).toEqual({ theme_rows_1: [] });
    for (const bad of [["9"], ["1", "1"], "1", [1], null])
      expect(() => validateAnswersPatch(s3, { theme_rows_1: bad }), JSON.stringify(bad)).toThrow(WorksheetAnswerError);
  });

  it("counts as filled only when something is ticked, and reads as 1, 2", () => {
    const f = findField(s3, "theme_rows_1")!;
    expect(worksheetProgress(s3, { theme_rows_1: [] }).missing).toContain("theme_rows_1");
    expect(worksheetProgress(s3, { theme_rows_1: ["1"] }).missing).not.toContain("theme_rows_1");
    expect(answerText(f, ["1", "2"], s3)).toBe("1, 2");
  });

  it("the worked example reaches 100 percent", () => {
    expect(worksheetProgress(s3, exampleAnswers()).percent).toBe(100);
  });
});

describe("top of worksheet callback", () => {
  const hypothesis = validateAnswersPatch(s2, { hypothesis: { person: "busy parents", problem: "dinner chaos", solution: "a weekly reset" } });
  const src = (status: CallbackSource["status"], answers: Answers = hypothesis): Map<string, CallbackSource> =>
    new Map([["m1-l2-business-direction", { title: "Lesson 2", schema: s2, answers, status }]]);

  it("reads its source from the Lesson 2 worksheet", () => {
    expect(callbackSourceSlugs(s3)).toEqual(["m1-l2-business-direction"]);
    expect(findField(s2, s3.callbacks![0]!.source_field)).toBeDefined();
  });

  it("quotes the hypothesis once Lesson 2 is complete", () => {
    const { top, sections } = resolveCallbacks(s3, src("complete"));
    expect(sections).toEqual({});
    expect(top).toEqual([
      {
        key: "l2_hypothesis",
        heading: "Where you started",
        text: "In Lesson 2 you wrote: I am exploring a business that helps busy parents solve dinner chaos through a weekly reset.",
        missingText: s3.callbacks![0]!.missing_text,
      },
    ]);
  });

  it("shows the missing text while Lesson 2 is unfinished, absent, or the sentence is incomplete", () => {
    expect(resolveCallbacks(s3, src("in_progress")).top[0]!.text).toBeNull();
    expect(resolveCallbacks(s3, new Map()).top[0]!.text).toBeNull();
    const partial = validateAnswersPatch(s2, { hypothesis: { person: "busy parents", problem: "", solution: "x" } });
    expect(resolveCallbacks(s3, src("complete", partial)).top[0]!.text).toBeNull();
  });

  it("{answer} fills with the whole source answer", () => {
    expect(fillCallbackTemplate("You wrote: {answer}", src("complete").get("m1-l2-business-direction")!, "hypothesis")).toBe(
      "You wrote: I am exploring a business that helps busy parents solve dinner chaos through a weekly reset.",
    );
  });
});

describe("Lesson 3 admin views", () => {
  const row = (answers: Answers): ResponseRow => ({ id: "r", name: "Member", email: "m@example.invalid", status: "in_progress", startedAt: "2026-11-01T00:00:00Z", updatedAt: "2026-11-01T00:00:00Z", completedAt: null, answers });

  it("counts observations per member and tallies confidence across every row", () => {
    const rows = [row(exampleAnswers()), row({ ev_said_1: "One", ev_said_2: "Two", ev_conf_1: "hypothesis", ev_conf_7: "confirmed" }), row({})];
    expect(adminCounts(s3, rows)).toEqual([
      { label: "Observations logged", value: "7", hint: "0 to 5 per member" },
      // Example: observed 4, confirmed 1. Second member: hypothesis 1, confirmed 1.
      { label: "Confidence: hypothesis / observed / confirmed", value: "1 / 4 / 2", hint: "Hypothesis 1, Observed 4, Confirmed 2" },
    ]);
    expect(adminCounts(s3, [])[0]!.hint).toBe("No responses yet");
    expect(adminCounts(s2, rows)).toEqual([]);
  });

  it("shows ticked rows as 1, 2 in the table and the CSV", () => {
    expect(adminColumns(s3).map((c) => c.header)).toEqual(["In one sentence", "Problem 1", "Problem 2", "Problem 3", "The first-offer audience", "One thing this research changes", "My next validation step"]);
    expect(adminCell(s3, "theme_1", exampleAnswers())).toEqual({ kind: "text", text: "Deciding what to cook is harder than cooking it" });
    expect(adminCell(s3, "theme_rows_1", exampleAnswers())).toEqual({ kind: "text", text: "1, 2" });
    const [header, line] = worksheetCsv(s3, [row(exampleAnswers())]).slice(1).trimEnd().split("\r\n");
    const cols = header!.split(",");
    expect(cols).toEqual(expect.arrayContaining(["ev_said_8", "ev_conf_1", "theme_rows_1", "snapshot"]));
    expect(line).toContain('"1, 2"');
    expect(line).toContain(",observed,");
  });
});
