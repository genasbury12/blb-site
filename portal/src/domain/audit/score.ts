import {
  ANSWER_KEYS,
  CATEGORIES,
  CATEGORY_DEPENDENCY_ORDER,
  CATEGORY_LABELS,
  CATEGORY_MODULE,
  type AnswerKey,
  type Answers,
  type AuditResult,
  type AuditVersion,
  type CatalogLesson,
  type Category,
  type CategoryScore,
  type GapKey,
  type LearningPath,
  type Priority,
  type RecommendedLesson,
  type RoadmapMonth,
} from "./types";

/**
 * Deterministic BOSS Business Audit scoring (handoff FINAL_04, Phase 2 "Audit and Scoring").
 * Pure function: same version + answers + catalog always yields the same result. No AI.
 *
 * Copy produced here (reasons, roadmap item titles) is DRAFT product copy pending owner
 * approval; see docs/IMPLEMENTATION_ISSUES.md.
 */
export const ENGINE_VERSION = "engine-1.0.0";

export const POINTS: Record<AnswerKey, number> = { A: 0, B: 1, C: 2, D: 3 };

export class AuditValidationError extends Error {
  constructor(
    message: string,
    readonly missing: string[] = [],
    readonly invalid: string[] = [],
  ) {
    super(message);
    this.name = "AuditValidationError";
  }
}

const isLow = (a: AnswerKey | undefined) => a === "A" || a === "B";

/** Validate a complete submission. v1 requires all questions and allows no N/A (D13). */
export function validateAnswers(version: AuditVersion, answers: Record<string, unknown>): Answers {
  const codes = new Set(version.questions.map((q) => q.code));
  const invalid: string[] = [];
  for (const [code, value] of Object.entries(answers)) {
    if (!codes.has(code) || typeof value !== "string" || !(ANSWER_KEYS as readonly string[]).includes(value)) {
      invalid.push(code);
    }
  }
  const missing = version.questions.filter((q) => answers[q.code] === undefined).map((q) => q.code);
  if (invalid.length > 0) {
    throw new AuditValidationError(`Invalid answers: ${invalid.join(", ")}`, missing, invalid);
  }
  if (missing.length > 0) {
    throw new AuditValidationError(`All ${version.questions.length} questions are required. Missing: ${missing.join(", ")}`, missing);
  }
  return answers as Answers;
}

function scoreCategories(version: AuditVersion, answers: Answers): Record<Category, CategoryScore> {
  const out = {} as Record<Category, CategoryScore>;
  for (const category of CATEGORIES) {
    const qs = version.questions.filter((q) => q.category === category);
    const earned = qs.reduce((sum, q) => sum + POINTS[answers[q.code]!], 0);
    const max = 3 * qs.length;
    const percent = max === 0 ? 0 : (earned / max) * 100;
    out[category] = { category, earned, max, percent, display: Math.round(percent) };
  }
  return out;
}

const PATH_QUESTIONS = ["Q1", "Q4", "Q5", "Q15"] as const;

function recommendPath(answers: Answers): AuditResult["pathRecommendation"] {
  const low = PATH_QUESTIONS.filter((c) => isLow(answers[c]));
  const path: LearningPath = low.length > 0 ? "build_from_scratch" : "optimize_automate";
  return {
    path,
    triggeredBy: low,
    reason:
      path === "build_from_scratch"
        ? "Some core pieces are not in place yet, such as your business stage, offer, website, or product. Build From Scratch helps you create them in a sensible order."
        : "Your business stage, offer, website, and product are already in place. Optimize & Automate helps you improve and connect what you have.",
  };
}

/** Essential gaps in dependency order (Phase 2 priority logic; delivery Q18 is grouped with product). */
const ESSENTIAL_GAPS: { gap: GapKey; category: Category; questions: string[]; title: string; reason: string }[] = [
  {
    gap: "clarity",
    category: "foundation",
    questions: ["Q2", "Q3", "Q4"],
    title: "Get clear on your customer and your offer",
    reason:
      "Your answers show that your customer, your promise, or your offer is not defined yet. Everything else you build depends on this, so it comes first.",
  },
  {
    gap: "product",
    category: "product",
    questions: ["Q15", "Q17", "Q18"],
    title: "Define and prepare your digital product",
    reason:
      "Your answers show that your product, its outcome, or how buyers receive it is not ready yet. You need something ready to sell before marketing can turn into sales.",
  },
  {
    gap: "sales",
    category: "email_sales",
    questions: ["Q21"],
    title: "Set up a working checkout",
    reason: "Your answers show that your checkout is not ready yet. Buyers need a tested way to pay you and get access.",
  },
  {
    gap: "website",
    category: "brand",
    questions: ["Q5", "Q7"],
    title: "Make your website explain your offer",
    reason:
      "Your answers show that your website is not live yet, or visitors cannot easily tell what you offer. Your site should make the next step obvious.",
  },
  {
    gap: "email",
    category: "email_sales",
    questions: ["Q19", "Q20"],
    title: "Build your email list and follow up",
    reason:
      "Your answers show that subscribers are not being collected, or nothing happens after they sign up. Email is how readers become buyers over time.",
  },
];

const LOWEST_CATEGORY_TITLES: Record<Category, string> = {
  foundation: "Strengthen your business foundation",
  brand: "Improve your brand and website",
  content: "Build a repeatable content workflow",
  marketing: "Plan how your content gets found",
  product: "Develop your digital product",
  email_sales: "Strengthen your email and sales system",
  ai: "Set up reviewed AI and automation workflows",
  productivity: "Create a weekly planning and review rhythm",
};

/** Approved Module 1 question-specific mappings (FINAL_04). Other modules: pending Phase 3. */
const MODULE1_QUESTION_LESSONS: Record<string, number[]> = {
  Q1: [1, 2],
  Q2: [3],
  Q3: [6, 7],
  Q4: [4, 5],
  Q16: [4],
  Q17: [5, 6],
};

function publishedEssential(catalog: CatalogLesson[]): CatalogLesson[] {
  return catalog
    .filter((l) => l.status === "published" && l.essential)
    .sort((a, b) => a.moduleNumber - b.moduleNumber || a.orderIndex - b.orderIndex);
}

function questionLessons(lowQuestions: string[], catalog: CatalogLesson[]): RecommendedLesson[] {
  const wanted = new Set<number>();
  for (const code of lowQuestions) for (const n of MODULE1_QUESTION_LESSONS[code] ?? []) wanted.add(n);
  return publishedEssential(catalog)
    .filter((l) => l.moduleNumber === 1 && wanted.has(l.orderIndex))
    .map((l) => ({ lessonId: l.id, moduleNumber: 1, orderIndex: l.orderIndex, title: l.title, mappingLevel: "question" as const }));
}

function categoryFallback(moduleNumber: number, catalog: CatalogLesson[]): RecommendedLesson[] {
  const first = publishedEssential(catalog).find((l) => l.moduleNumber === moduleNumber);
  return first
    ? [{ lessonId: first.id, moduleNumber, orderIndex: first.orderIndex, title: first.title, mappingLevel: "category" }]
    : [];
}

function lessonsFor(category: Category, lowQuestions: string[], catalog: CatalogLesson[]): RecommendedLesson[] {
  const moduleNumber = CATEGORY_MODULE[category];
  const specific = questionLessons(lowQuestions, catalog);
  const seen = new Set(specific.map((l) => l.lessonId));
  const fallback = categoryFallback(moduleNumber, catalog).filter((l) => !seen.has(l.lessonId));
  // For Module 1 the specific mapping is the recommendation; the category fallback is only used when none matched.
  if (moduleNumber === 1) return specific.length > 0 ? specific : fallback;
  return [...specific, ...fallback];
}

const dependencyRank = (c: Category) => CATEGORY_DEPENDENCY_ORDER.indexOf(c);

function selectPriorities(answers: Answers, scores: Record<Category, CategoryScore>, catalog: CatalogLesson[]): Priority[] {
  const picks: Omit<Priority, "rank">[] = [];
  const usedCategories = new Set<Category>();

  for (const gap of ESSENTIAL_GAPS) {
    if (picks.length === 3) break;
    const low = gap.questions.filter((c) => isLow(answers[c]));
    if (low.length === 0) continue;
    const relatedLow = gap.gap === "product" && isLow(answers.Q16) ? [...low, "Q16"] : low;
    picks.push({
      kind: "essential_gap",
      gap: gap.gap,
      category: gap.category,
      moduleNumber: CATEGORY_MODULE[gap.category],
      title: gap.title,
      reason: gap.reason,
      triggeredBy: low,
      lessons: lessonsFor(gap.category, relatedLow, catalog),
    });
    usedCategories.add(gap.category);
  }

  const remaining = [...CATEGORIES]
    .filter((c) => !usedCategories.has(c))
    .sort((a, b) => scores[a].percent - scores[b].percent || dependencyRank(a) - dependencyRank(b));

  for (const category of remaining) {
    if (picks.length === 3) break;
    const lowFoundation = ["Q1", "Q2", "Q3", "Q4"].filter((c) => isLow(answers[c]));
    picks.push({
      kind: "lowest_category",
      category,
      moduleNumber: CATEGORY_MODULE[category],
      title: LOWEST_CATEGORY_TITLES[category],
      reason: `${CATEGORY_LABELS[category]} scored ${scores[category].display}% based on your answers, one of your lowest areas right now.`,
      triggeredBy: [],
      lessons: lessonsFor(category, category === "foundation" ? lowFoundation : [], catalog),
    });
  }

  return picks.map((p, i) => ({ ...p, rank: (i + 1) as 1 | 2 | 3 }));
}

const ROADMAP_THEMES: { month: RoadmapMonth["month"]; theme: string; categories: Category[] }[] = [
  { month: 1, theme: "Clarity & Foundation", categories: ["foundation"] },
  { month: 2, theme: "Brand & Business Home", categories: ["brand"] },
  { month: 3, theme: "Product & Sales Infrastructure", categories: ["product", "email_sales"] },
  { month: 4, theme: "Content & Visibility", categories: ["content", "marketing"] },
  { month: 5, theme: "Systems & Automation", categories: ["ai", "productivity"] },
  { month: 6, theme: "Launch, Optimize & Grow", categories: [] },
];

function buildRoadmap(scores: Record<Category, CategoryScore>, priorities: Priority[], catalog: CatalogLesson[]): RoadmapMonth[] {
  const priorityCategories = new Set(priorities.map((p) => p.category));
  return ROADMAP_THEMES.map(({ month, theme, categories }) => {
    const items = [...categories]
      .sort((a, b) => scores[a].percent - scores[b].percent || dependencyRank(a) - dependencyRank(b))
      .map((category) => {
        const priority = priorities.find((p) => p.category === category);
        const lesson = priority?.lessons[0] ?? categoryFallback(CATEGORY_MODULE[category], catalog)[0] ?? null;
        const item: RoadmapMonth["items"][number] = {
          title: `Work through Module ${CATEGORY_MODULE[category]}: ${CATEGORY_LABELS[category]}`,
          reason: priorityCategories.has(category)
            ? `This is one of your top three priorities. Your ${CATEGORY_LABELS[category]} score is ${scores[category].display}%.`
            : `Your ${CATEGORY_LABELS[category]} score is ${scores[category].display}%.`,
          moduleNumber: CATEGORY_MODULE[category],
          lessonId: lesson?.lessonId ?? null,
          isPriority: priorityCategories.has(category),
        };
        return item;
      });
    if (month === 6) {
      items.push({
        title: "Review your progress and retake the business audit",
        reason: "Compare your new results with this report to choose what to improve next. Your completed work is kept.",
        moduleNumber: null,
        lessonId: null,
        isPriority: false,
      });
    }
    return { month, theme, items };
  });
}

/** Audit versions whose path and priority rules are implemented. A new version needs approved rules first. */
export const SUPPORTED_AUDIT_VERSIONS = [1] as const;

export function scoreAudit(version: AuditVersion, rawAnswers: Record<string, unknown>, catalog: CatalogLesson[] = []): AuditResult {
  if (!(SUPPORTED_AUDIT_VERSIONS as readonly number[]).includes(version.version)) {
    throw new AuditValidationError(`Audit version ${version.version} has no approved scoring rules yet.`);
  }
  const answers = validateAnswers(version, rawAnswers);
  const categoryScores = scoreCategories(version, answers);
  const overallPercent = CATEGORIES.reduce((sum, c) => sum + categoryScores[c].percent, 0) / CATEGORIES.length;
  const pathRecommendation = recommendPath(answers);
  const priorityRecommendations = selectPriorities(answers, categoryScores, catalog);
  const strengths = [...CATEGORIES]
    .sort((a, b) => categoryScores[b].percent - categoryScores[a].percent || dependencyRank(a) - dependencyRank(b))
    .slice(0, 3)
    .map((category) => ({ category, display: categoryScores[category].display }));

  const startingLesson = priorityRecommendations.flatMap((p) => p.lessons)[0] ?? null;

  const result: AuditResult = {
    scoringVersion: `audit-v${version.version}/${ENGINE_VERSION}`,
    auditVersion: version.version,
    categoryScores,
    overallScore: { percent: overallPercent, display: Math.round(overallPercent) },
    pathRecommendation,
    strengths,
    priorityRecommendations,
    startingLesson,
    roadmapRecommendation: buildRoadmap(categoryScores, priorityRecommendations, catalog),
    explanations: [
      "Scores reflect your self reported answers about how established each part of your business is. They are not a prediction of revenue or results.",
      "Each answer earns 0 to 3 points. Each area's score is the points you earned divided by the points available. Your overall score is the average of the eight areas, so every area counts equally.",
      "Lesson suggestions outside Module 1 are matched by area, not by individual question, until detailed lesson mapping is published.",
    ],
  };
  return deepFreeze(result);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>)) deepFreeze(v);
    Object.freeze(value);
  }
  return value;
}
