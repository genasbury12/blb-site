// @vitest-environment node
import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import l1 from "@/domain/worksheets/fixtures/m1-l1-starting-point.json";
import l2 from "@/domain/worksheets/fixtures/m1-l2-business-direction.json";
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
  }, 30000);

  it("prints used idea columns and every required field; skips unused optional ideas", () => {
    const keys = printedKeys(s2, answers2);
    expect(keys).toEqual(expect.arrayContaining(["cred_A", "cred_B", "hypothesis", "review_date"]));
    expect(keys).not.toContain("cred_C");
    expect(keys).not.toContain("need_B");
    expect(keys).not.toContain("idea_C");
  });

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

  it("names files as the brief asks", () => {
    expect(worksheetPdfFilename(1, 2)).toBe("BOSS_Module1_Lesson2_Worksheet.pdf");
    expect(worksheetPdfFilename(1)).toBe("BOSS_Module1_Worksheets.pdf");
  });
});
