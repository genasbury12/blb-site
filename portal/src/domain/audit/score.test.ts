import { describe, expect, it } from "vitest";
import { AuditValidationError, scoreAudit, validateAnswers } from "./score";
import { CATEGORIES, type AnswerKey, type Answers, type CatalogLesson } from "./types";
import { AUDIT_V1 } from "./v1";

const all = (key: AnswerKey): Answers => Object.fromEntries(AUDIT_V1.questions.map((q) => [q.code, key]));
const withOverrides = (base: AnswerKey, overrides: Record<string, AnswerKey>): Answers => ({ ...all(base), ...overrides });

/** Fixture catalog: Module 1 lessons 1 to 7, and lessons 1 and 2 in other modules. Not real content. */
function fixtureCatalog(): CatalogLesson[] {
  const lessons: CatalogLesson[] = [];
  for (let n = 1; n <= 7; n++) {
    lessons.push({ id: `m1-l${n}`, moduleNumber: 1, orderIndex: n, title: `SAMPLE: Module 1 lesson ${n}`, essential: true, status: "published" });
  }
  for (let m = 2; m <= 8; m++) {
    lessons.push({ id: `m${m}-l1`, moduleNumber: m, orderIndex: 1, title: `SAMPLE: Module ${m} lesson 1`, essential: true, status: "published" });
    lessons.push({ id: `m${m}-l2`, moduleNumber: m, orderIndex: 2, title: `SAMPLE: Module ${m} lesson 2`, essential: false, status: "published" });
  }
  return lessons;
}

describe("canonical v1 structure", () => {
  it("has 30 questions in the approved category ranges", () => {
    expect(AUDIT_V1.questions).toHaveLength(30);
    const ranges: Record<string, [number, number]> = {
      foundation: [1, 4], brand: [5, 7], content: [8, 11], marketing: [12, 14],
      product: [15, 18], email_sales: [19, 22], ai: [23, 26], productivity: [27, 30],
    };
    for (const q of AUDIT_V1.questions) {
      const [lo, hi] = ranges[q.category]!;
      expect(q.number >= lo && q.number <= hi, q.code).toBe(true);
      expect(q.options.map((o) => o.key)).toEqual(["A", "B", "C", "D"]);
    }
  });
});

describe("scoring", () => {
  it("all A scores zero everywhere", () => {
    const r = scoreAudit(AUDIT_V1, all("A"));
    expect(r.overallScore.percent).toBe(0);
    for (const c of CATEGORIES) expect(r.categoryScores[c].percent).toBe(0);
  });

  it("all D scores 100 everywhere", () => {
    const r = scoreAudit(AUDIT_V1, all("D"));
    expect(r.overallScore.percent).toBe(100);
    for (const c of CATEGORIES) expect(r.categoryScores[c].display).toBe(100);
  });

  it("overall is the mean of category percentages, not weighted by question count", () => {
    // Brand has 3 questions, Foundation has 4. All D in brand, all A elsewhere.
    const answers = withOverrides("A", { Q5: "D", Q6: "D", Q7: "D" });
    const r = scoreAudit(AUDIT_V1, answers);
    expect(r.categoryScores.brand.percent).toBe(100);
    expect(r.overallScore.percent).toBeCloseTo(100 / 8, 10);
    // A raw-sum approach would give 9 / 90 = 10%; the approved rule gives 12.5%.
    expect(r.overallScore.display).toBe(13);
  });

  it("keeps raw precision and rounds only for display", () => {
    // Foundation: B, B, B, A = 3 / 12 = 25. Brand: B, A, A = 1 / 9 = 11.11...
    const answers = withOverrides("D", { Q1: "B", Q2: "B", Q3: "B", Q4: "A", Q5: "B", Q6: "A", Q7: "A" });
    const r = scoreAudit(AUDIT_V1, answers);
    expect(r.categoryScores.foundation.percent).toBe(25);
    expect(r.categoryScores.brand.percent).toBeCloseTo(11.1111, 3);
    expect(r.categoryScores.brand.display).toBe(11);
    expect(r.overallScore.percent).toBeCloseTo((25 + 100 / 9 + 600) / 8, 10);
  });

  it("is deterministic and immutable", () => {
    const a = scoreAudit(AUDIT_V1, withOverrides("C", { Q9: "A" }), fixtureCatalog());
    const b = scoreAudit(AUDIT_V1, withOverrides("C", { Q9: "A" }), fixtureCatalog());
    expect(a).toEqual(b);
    expect(Object.isFrozen(a)).toBe(true);
    expect(Object.isFrozen(a.categoryScores.foundation)).toBe(true);
    expect(a.scoringVersion).toBe("audit-v1/engine-1.0.0");
  });
});

describe("validation", () => {
  it("cannot submit with a missing answer", () => {
    const answers: Record<string, string> = { ...all("C") };
    delete answers.Q30;
    expect(() => scoreAudit(AUDIT_V1, answers)).toThrow(AuditValidationError);
    try {
      validateAnswers(AUDIT_V1, answers);
    } catch (err) {
      expect((err as AuditValidationError).missing).toEqual(["Q30"]);
    }
  });

  it("rejects N/A in v1 because no eligibility rules are approved", () => {
    expect(() => scoreAudit(AUDIT_V1, { ...all("C"), Q23: "N/A" })).toThrow(/Invalid answers: Q23/);
  });

  it("rejects unknown question codes and values", () => {
    expect(() => scoreAudit(AUDIT_V1, { ...all("C"), Q31: "A" })).toThrow(/Q31/);
    expect(() => scoreAudit(AUDIT_V1, { ...all("C"), Q2: "E" })).toThrow(/Q2/);
  });

  it("refuses to score an audit version without approved rules", () => {
    const v2 = { ...AUDIT_V1, version: 2 };
    expect(() => scoreAudit(v2, all("C"))).toThrow(/version 2 has no approved scoring rules/);
  });
});

describe("path recommendation", () => {
  it("Optimize & Automate when Q1, Q4, Q5 and Q15 are all C or D", () => {
    expect(scoreAudit(AUDIT_V1, all("C")).pathRecommendation.path).toBe("optimize_automate");
  });

  it.each(["Q1", "Q4", "Q5", "Q15"])("Build From Scratch when %s is B (threshold boundary)", (code) => {
    const atB = scoreAudit(AUDIT_V1, withOverrides("C", { [code]: "B" }));
    expect(atB.pathRecommendation.path).toBe("build_from_scratch");
    expect(atB.pathRecommendation.triggeredBy).toEqual([code]);
    const atC = scoreAudit(AUDIT_V1, withOverrides("C", { [code]: "C" }));
    expect(atC.pathRecommendation.path).toBe("optimize_automate");
  });

  it("ignores low answers on non-path questions", () => {
    const r = scoreAudit(AUDIT_V1, withOverrides("C", { Q2: "A", Q21: "A", Q30: "A" }));
    expect(r.pathRecommendation.path).toBe("optimize_automate");
  });
});

describe("priorities", () => {
  it("returns exactly three distinct priorities with reasons and modules", () => {
    const r = scoreAudit(AUDIT_V1, all("B"), fixtureCatalog());
    expect(r.priorityRecommendations).toHaveLength(3);
    expect(r.priorityRecommendations.map((p) => p.rank)).toEqual([1, 2, 3]);
    const keys = r.priorityRecommendations.map((p) => p.gap ?? p.category);
    expect(new Set(keys).size).toBe(3);
    for (const p of r.priorityRecommendations) {
      expect(p.reason.length).toBeGreaterThan(20);
      expect(p.moduleNumber).toBeGreaterThanOrEqual(1);
    }
  });

  it("resolves conflicting essential gaps in dependency order: clarity, product, sales before website and email", () => {
    const r = scoreAudit(AUDIT_V1, all("A"), fixtureCatalog());
    expect(r.priorityRecommendations.map((p) => p.gap)).toEqual(["clarity", "product", "sales"]);
  });

  it("skips resolved essentials and continues in order", () => {
    const r = scoreAudit(AUDIT_V1, withOverrides("D", { Q7: "B", Q20: "A", Q21: "C" }), fixtureCatalog());
    expect(r.priorityRecommendations.map((p) => p.gap)).toEqual(["website", "email", undefined]);
    expect(r.priorityRecommendations[2]!.kind).toBe("lowest_category");
  });

  it("fills remaining slots with the lowest categories, tie broken by dependency order", () => {
    // No essential gaps. Content and AI tie at the lowest score; content comes first in dependency order.
    const r = scoreAudit(AUDIT_V1, withOverrides("D", { Q8: "A", Q9: "A", Q23: "A", Q24: "A", Q28: "C" }), fixtureCatalog());
    expect(r.categoryScores.content.percent).toBe(r.categoryScores.ai.percent);
    expect(r.priorityRecommendations.map((p) => p.category)).toEqual(["content", "ai", "productivity"]);
  });

  it("with all equal scores, falls back to dependency order", () => {
    const r = scoreAudit(AUDIT_V1, all("D"), fixtureCatalog());
    expect(r.priorityRecommendations.map((p) => p.category)).toEqual(["foundation", "product", "email_sales"]);
  });
});

describe("lesson recommendations", () => {
  it("uses the approved Module 1 question mapping", () => {
    // Clarity gap from Q2 only: lesson 3.
    const r = scoreAudit(AUDIT_V1, withOverrides("D", { Q2: "B" }), fixtureCatalog());
    const p = r.priorityRecommendations[0]!;
    expect(p.gap).toBe("clarity");
    expect(p.lessons).toEqual([{ lessonId: "m1-l3", moduleNumber: 1, orderIndex: 3, title: "SAMPLE: Module 1 lesson 3", mappingLevel: "question" }]);
    expect(r.startingLesson?.lessonId).toBe("m1-l3");
  });

  it("maps Q3 to lessons 6 and 7 and Q4 to lessons 4 and 5", () => {
    const r = scoreAudit(AUDIT_V1, withOverrides("D", { Q3: "A", Q4: "B" }), fixtureCatalog());
    expect(r.priorityRecommendations[0]!.lessons.map((l) => l.orderIndex)).toEqual([4, 5, 6, 7]);
  });

  it("uses an explicitly labeled category-level fallback outside Module 1", () => {
    const r = scoreAudit(AUDIT_V1, withOverrides("D", { Q21: "A" }), fixtureCatalog());
    const p = r.priorityRecommendations[0]!;
    expect(p.gap).toBe("sales");
    expect(p.lessons).toEqual([{ lessonId: "m6-l1", moduleNumber: 6, orderIndex: 1, title: "SAMPLE: Module 6 lesson 1", mappingLevel: "category" }]);
  });

  it("adds approved Module 1 lessons for Q16 and Q17 to a product priority", () => {
    const r = scoreAudit(AUDIT_V1, withOverrides("D", { Q16: "A", Q17: "B" }), fixtureCatalog());
    const p = r.priorityRecommendations[0]!;
    expect(p.gap).toBe("product");
    expect(p.lessons.map((l) => [l.moduleNumber, l.orderIndex, l.mappingLevel])).toEqual([
      [1, 4, "question"],
      [1, 5, "question"],
      [1, 6, "question"],
      [5, 1, "category"],
    ]);
  });

  it("references published essential lessons only", () => {
    const catalog = fixtureCatalog().map((l) =>
      l.id === "m1-l3" ? { ...l, status: "draft" as const } : l.id === "m6-l1" ? { ...l, status: "review" as const } : l,
    );
    const r = scoreAudit(AUDIT_V1, withOverrides("D", { Q2: "B", Q21: "A" }), catalog);
    const ids = r.priorityRecommendations.flatMap((p) => p.lessons.map((l) => l.lessonId));
    expect(ids).not.toContain("m1-l3");
    expect(ids).not.toContain("m6-l1");
    expect(ids).not.toContain("m6-l2"); // optional tutorial, not essential
    for (const month of r.roadmapRecommendation) for (const item of month.items) {
      if (item.lessonId) expect(catalog.find((l) => l.id === item.lessonId)?.status).toBe("published");
    }
  });

  it("returns no lesson rather than inventing one when nothing is published", () => {
    const r = scoreAudit(AUDIT_V1, all("A"), []);
    expect(r.startingLesson).toBeNull();
    expect(r.priorityRecommendations.every((p) => p.lessons.length === 0)).toBe(true);
  });
});

describe("report content", () => {
  it("includes three strengths and a six month roadmap with the approved themes", () => {
    const r = scoreAudit(AUDIT_V1, withOverrides("B", { Q27: "D", Q28: "D", Q29: "D", Q30: "D" }), fixtureCatalog());
    expect(r.strengths[0]).toEqual({ category: "productivity", display: 100 });
    expect(r.strengths).toHaveLength(3);
    expect(r.roadmapRecommendation.map((m) => m.theme)).toEqual([
      "Clarity & Foundation",
      "Brand & Business Home",
      "Product & Sales Infrastructure",
      "Content & Visibility",
      "Systems & Automation",
      "Launch, Optimize & Grow",
    ]);
  });

  it("never mentions income, revenue promises, or uses dashes in generated copy", () => {
    const r = scoreAudit(AUDIT_V1, all("A"), fixtureCatalog());
    const text = JSON.stringify(r);
    expect(text).not.toMatch(/[–—]/);
    expect(text).not.toMatch(/guarantee|\$\d|income/i);
  });
});
