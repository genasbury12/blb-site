// @vitest-environment node
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import l1 from "@/domain/worksheets/fixtures/m1-l1-starting-point.json";
import l2 from "@/domain/worksheets/fixtures/m1-l2-business-direction.json";
import { parseWorksheetSchema, validateAnswersPatch } from "@/domain/worksheets/schema";
import { renderWorksheetPdf } from "./worksheet-pdf";

/**
 * Regression (2026-11-04): with fonts loaded once per process, a PDF made after another one lost characters the first
 * one had not used (Lesson 1 question numbers vanished after a Lesson 2 PDF). Reads the PDF text with pdftotext,
 * so it is skipped where poppler is not installed.
 */
function pdftotextAvailable() {
  try {
    execFileSync("pdftotext", ["-v"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

describe.skipIf(!pdftotextAvailable())("PDF fonts across several PDFs in one process", () => {
  it("a Lesson 1 PDF made after a Lesson 2 PDF keeps every character", async () => {
    const dir = mkdtempSync(join(tmpdir(), "pdf-fonts-"));
    const s1 = parseWorksheetSchema(l1);
    const s2 = parseWorksheetSchema(l2);
    await renderWorksheetPdf({ schema: s2, answers: validateAnswersPatch(s2, { idea_A: "Idea", why: "Short." }), moduleNumber: 1, lessonNumber: 2, memberName: null, completedAt: null });
    const [a, b] = await Promise.all([1, 2].map(() => renderWorksheetPdf({ schema: s1, answers: { q1: "Blog posts", q2: "A system", q3: "Partly", realization: "Start." }, moduleNumber: 1, lessonNumber: 1, memberName: null, completedAt: null })));
    for (const [i, buf] of [a!, b!].entries()) {
      const file = join(dir, `l1-${i}.pdf`);
      writeFileSync(file, buf);
      const text = execFileSync("pdftotext", [file, "-"]).toString();
      expect(text).toContain("1. What have you been treating");
      expect(text).toContain("4. Your Biggest Realization");
    }
  }, 60000);
});
