// @vitest-environment node
import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import l1 from "@/domain/worksheets/fixtures/m1-l1-starting-point.json";
import l2 from "@/domain/worksheets/fixtures/m1-l2-business-direction.json";
import l3 from "@/domain/worksheets/fixtures/m1-l3-customer-research.json";
import { parseWorksheetSchema, validateAnswersPatch } from "@/domain/worksheets/schema";
import { printedKeys, renderModuleWorksheetsPdf, renderWorksheetPdf, worksheetPdfFilename } from "./worksheet-pdf";

const s1 = parseWorksheetSchema(l1);
const s2 = parseWorksheetSchema(l2);
const long = "I have been treating my blog posts and Pinterest as the business. ".repeat(22).slice(0, 1500);
const answers2 = validateAnswersPatch(s2, {
  idea_A: "Meal planning for parents of picky eaters",
  idea_B: "Pantry organization for small kitchens",
  cred_A: { rating: "strong", note: "Ten years as a pediatric dietitian." },
  cred_B: { rating: "weak", note: "I have no training in this." },
  need_A: { rating: "uncertain", note: "Parents ask me weekly; I have not checked who pays. https://example.com/a-very-long-link-that-has-no-spaces-at-all-and-keeps-going-for-a-while" },
  fit_A: { rating: "weak", note: long.slice(0, 600) },
  logic_A: { rating: "strong", note: "A weekly plan that saves an hour of arguing." },
  assume_A: "That parents will pay for a plan rather than free recipes.",
  chosen: "A",
  hypothesis: { person: "parents of picky eaters", problem: "dinner battles", solution: "weekly meal plans" },
  why: long.slice(0, 1200),
  assumption: "They will pay.",
  next_step: "Talk to five parents.",
  review_date: "2026-12-01",
});

describe("worksheet PDF", () => {
  it("renders the Lesson 2 worksheet with long answers", async () => {
    const buf = await renderWorksheetPdf({ schema: s2, answers: answers2, moduleNumber: 1, lessonNumber: 2, memberName: "Test Member", completedAt: "2026-11-03T15:00:00Z" });
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
    if (process.env.WS_PDF_OUT) writeFileSync(`${process.env.WS_PDF_OUT}/lesson2.pdf`, buf);
    const raw = buf.toString("latin1");
    for (const font of ["CormorantGaramond-Medium", "CormorantGaramondItalic-MediumItalic", "DMSans-14pt", "DMSans-14ptSemiBold"]) expect(raw).toMatch(new RegExp(`/BaseFont /[A-Z]{6}\\+${font}`));
    expect(raw).not.toMatch(/\/BaseFont \/(Helvetica|Times)/);
  }, 30000);

  it("prints used idea columns and every required field; skips unused optional ideas", () => {
    const keys = printedKeys(s2, answers2);
    expect(keys).toEqual(expect.arrayContaining(["cred_A", "cred_B", "hypothesis", "review_date"]));
    expect(keys).not.toContain("cred_C");
    expect(keys).not.toContain("need_B");
    expect(keys).not.toContain("idea_C");
  });

  it("renders the Lesson 1 worksheet with its footer note", async () => {
    const buf = await renderWorksheetPdf({ schema: s1, answers: { q1: "Blog posts", q2: "A home system", q3: "Partly", realization: "Start with the person." }, moduleNumber: 1, lessonNumber: 1, memberName: null, completedAt: "2026-11-02T15:00:00Z" });
    expect(s1.footer_note).toBeTruthy();
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
    if (process.env.WS_PDF_OUT) writeFileSync(`${process.env.WS_PDF_OUT}/lesson1.pdf`, buf);
  }, 30000);

  it("renders a module PDF with several worksheets", async () => {
    const buf = await renderModuleWorksheetsPdf(
      [
        { schema: s1, answers: { q1: "Blog posts", q2: "A home system", q3: "Partly", realization: "Start with the person." }, moduleNumber: 1, lessonNumber: 1, memberName: null, completedAt: "2026-11-02T15:00:00Z" },
        { schema: s2, answers: answers2, moduleNumber: 1, lessonNumber: 2, memberName: null, completedAt: null, callbacks: { decision: { label: "Lesson 1", text: "Partly" } } },
      ],
      1,
    );
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
    if (process.env.WS_PDF_OUT) writeFileSync(`${process.env.WS_PDF_OUT}/module1.pdf`, buf);
  }, 30000);

  it("Lesson 3 prints only observation rows with content, ticked rows as numbers, and the Lesson 2 quote", async () => {
    const s3 = parseWorksheetSchema(l3);
    const raw: Record<string, unknown> = { ...(l3.example_response as Record<string, unknown>), review_date: "2026-11-15" };
    delete raw.label;
    const answers = validateAnswersPatch(s3, { ...raw, ev_said_7: "\"I would pay for someone to just decide.\"", ev_conf_7: "hypothesis" });
    const keys = printedKeys(s3, answers);
    // Rows 1 to 5 and 7 have content; 6 and 8 do not print at all.
    expect(keys.filter((k) => k.startsWith("ev_said_"))).toEqual(["ev_said_1", "ev_said_2", "ev_said_3", "ev_said_4", "ev_said_5", "ev_said_7"]);
    // Within a row, an empty optional field is left out.
    expect(keys).toContain("ev_conf_7");
    expect(keys).not.toContain("ev_source_7");
    // An empty required observation row is still left out (brief: only rows with content).
    expect(printedKeys(s3, { ev_said_1: "x" }).filter((k) => k.startsWith("ev_"))).toEqual(["ev_said_1", "ev_source_1", "ev_meaning_1", "ev_question_1", "ev_conf_1"]);
    // The three problems are required, so they print even when empty.
    expect(printedKeys(s3, {})).toEqual(expect.arrayContaining(["theme_1", "theme_rows_3", "snapshot", "review_date"]));

    const buf = await renderWorksheetPdf({
      schema: s3,
      answers,
      moduleNumber: 1,
      lessonNumber: 3,
      memberName: "Test Member",
      completedAt: "2026-11-05T15:00:00Z",
      topCallbacks: [{ key: "l2_hypothesis", heading: "Where you started", text: "In Lesson 2 you wrote: I am exploring a business that helps parents solve dinner battles through meal plans.", missingText: "x" }],
    });
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
    if (process.env.WS_PDF_OUT) writeFileSync(`${process.env.WS_PDF_OUT}/lesson3.pdf`, buf);
  }, 30000);

  it("names files as the brief asks", () => {
    expect(worksheetPdfFilename(1, 2)).toBe("BOSS_Module1_Lesson2_Worksheet.pdf");
    expect(worksheetPdfFilename(1)).toBe("BOSS_Module1_Worksheets.pdf");
  });
});
