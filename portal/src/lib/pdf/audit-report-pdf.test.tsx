// @vitest-environment node
import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { scoreAudit } from "@/domain/audit/score";
import { AUDIT_V1 } from "@/domain/audit/v1";
import { renderAuditReportPdf } from "./audit-report-pdf";

describe("audit PDF", () => {
  it("renders a multi page PDF from a run snapshot", async () => {
    const answers = Object.fromEntries(AUDIT_V1.questions.map((q) => [q.code, q.number % 3 ? "B" : "C"]));
    const { categoryScores, ...rec } = scoreAudit(AUDIT_V1, answers, []);
    const buf = await renderAuditReportPdf(
      { id: "x", submitted_at: "2027-02-15T17:00:00Z", overall_score: rec.overallScore.percent, scoring_version: rec.scoringVersion, category_scores_json: categoryScores, recommendation_snapshot_json: rec },
      "Test",
    );
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(buf.length).toBeGreaterThan(3000);
    // Brand fonts are embedded, not the PDF standard fonts.
    if (process.env.WS_PDF_OUT) writeFileSync(`${process.env.WS_PDF_OUT}/audit.pdf`, buf);
    const raw = buf.toString("latin1");
    expect(raw).toMatch(/\/BaseFont \/[A-Z]{6}\+CormorantGaramond-Medium/);
    expect(raw).toMatch(/\/BaseFont \/[A-Z]{6}\+DMSans/);
    expect(raw).not.toMatch(/\/BaseFont \/(Helvetica|Times)/);
  }, 30000);
});
