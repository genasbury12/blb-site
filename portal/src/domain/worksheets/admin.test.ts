import { describe, expect, it } from "vitest";
import l1 from "./fixtures/m1-l1-starting-point.json";
import l2 from "./fixtures/m1-l2-business-direction.json";
import { adminCell, adminColumns, csvCell, exportStampLine, resolveColumnKey, weakCounts, worksheetCsv, worksheetCsvFilename, type ResponseRow } from "./admin";
import { concreteFields, parseWorksheetSchema, validateAnswersPatch } from "./schema";

const s1 = parseWorksheetSchema(l1);
const s2 = parseWorksheetSchema(l2);

const a2 = validateAnswersPatch(s2, {
  idea_A: "Meal planning for parents of picky eaters",
  idea_B: "Pantry organization",
  cred_A: { rating: "strong", note: "Ten years as a dietitian." },
  cred_B: { rating: "weak", note: "No training." },
  need_A: { rating: "weak", note: "Not checked, who pays." },
  chosen: "A",
  hypothesis: { person: "parents", problem: "dinner battles", solution: "meal plans" },
  assumption: "=They will pay",
});

const row = (over: Partial<ResponseRow> = {}): ResponseRow => ({
  id: "r1",
  name: "Test, \"Member\"",
  email: "member@example.invalid",
  status: "in_progress",
  startedAt: "2026-11-01T10:00:00.000Z",
  updatedAt: "2026-11-02T10:00:00.000Z",
  completedAt: null,
  answers: a2,
  ...over,
});

describe("admin columns", () => {
  it("reads the schema's admin_columns with readable headers", () => {
    expect(adminColumns(s2).map((c) => c.header)).toEqual([
      "I'm testing",
      "Credibility (chosen)",
      "Buyer need (chosen)",
      "Delivery fit (chosen)",
      "Commercial logic (chosen)",
      "My biggest unchecked assumption",
    ]);
    expect(adminColumns(s1).map((c) => c.spec)).toEqual(["q3", "realization"]);
  });

  it("resolves {chosen} to the member's chosen idea, or nothing when unchosen", () => {
    expect(resolveColumnKey("cred_{chosen}", a2)).toBe("cred_A");
    expect(resolveColumnKey("cred_{chosen}", { ...a2, chosen: "B" })).toBe("cred_B");
    expect(resolveColumnKey("cred_{chosen}", {})).toBeNull();
    expect(adminCell(s2, "cred_{chosen}", {})).toEqual({ kind: "text", text: "" });
  });

  it("renders rating cells as rating plus note, and the choice with the idea name", () => {
    expect(adminCell(s2, "cred_{chosen}", a2)).toEqual({ kind: "rating", rating: "strong", label: "Strong", note: "Ten years as a dietitian." });
    expect(adminCell(s2, "chosen", a2)).toEqual({ kind: "text", text: "A: Meal planning for parents of picky eaters" });
  });

  it("counts Weak ratings per rating column for the chosen idea only", () => {
    const rows = [row(), row({ answers: { ...a2, chosen: "B" } }), row({ answers: {} })];
    const counts = Object.fromEntries(weakCounts(s2, rows).map((c) => [c.header, c.weak]));
    // Row 1 chose A (need weak), row 2 chose B (cred weak), row 3 chose nothing.
    expect(counts).toEqual({ "Credibility (chosen)": 1, "Buyer need (chosen)": 1, "Delivery fit (chosen)": 0, "Commercial logic (chosen)": 0 });
  });
});

describe("CSV export", () => {
  it("has one column per field key, ratings split in two, sentence as text", () => {
    const csv = worksheetCsv(s2, [row({ status: "complete", completedAt: "2026-11-03T10:00:00.000Z" })]);
    expect(csv.startsWith("﻿")).toBe(true);
    const [header, line] = csv.slice(1).trimEnd().split("\r\n");
    const cols = header!.split(",");
    expect(cols.slice(0, 6)).toEqual(["name", "email", "status", "started_at", "updated_at", "completed_at"]);
    expect(cols).toEqual(expect.arrayContaining(["idea_A", "cred_A_rating", "cred_A_note", "cred_C_rating", "hypothesis", "review_date"]));
    expect(cols).not.toContain("cred_A");
    const ratingFields = concreteFields(s2).filter((f) => f.type === "rating").length;
    expect(cols.length).toBe(6 + concreteFields(s2).length + ratingFields);
    expect(line).toContain('"Test, ""Member"""');
    expect(line).toContain("strong,Ten years as a dietitian.");
    expect(line).toContain("I am exploring a business that helps parents solve dinner battles through meal plans.");
    expect(line).toContain("'=They will pay");
  });

  it("leaves an untouched sentence blank instead of printing placeholders", () => {
    const csv = worksheetCsv(s2, [row({ answers: { idea_A: "x" } })]);
    expect(csv).not.toContain("[person]");
  });

  it("guards formula injection and quotes separators", () => {
    expect(csvCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(csvCell("+1")).toBe("'+1");
    expect(csvCell("-2")).toBe("'-2");
    expect(csvCell("@cmd")).toBe("'@cmd");
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell("line\nbreak")).toBe('"line\nbreak"');
    expect(csvCell(null)).toBe("");
  });

  it("an admin export starts with who exported it and when, then the column headers", () => {
    const at = new Date("2026-11-04T18:30:00Z");
    const csv = worksheetCsv(s2, [row()], { by: "Genasys", at });
    const [first, header] = csv.slice(1).split("\r\n");
    expect(first).toBe(csvCell(exportStampLine({ by: "Genasys", at })));
    expect(first).toContain("Exported by Genasys on November 4, 2026");
    expect(first).toContain("Member answers are private.");
    expect(header!.startsWith("name,email,status")).toBe(true);
  });

  it("names the file by slug and date", () => {
    expect(worksheetCsvFilename("m1-l2-business-direction", new Date("2026-11-03T12:00:00Z"))).toBe("m1-l2-business-direction_responses_2026-11-03.csv");
  });
});
