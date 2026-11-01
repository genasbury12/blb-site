export const ANSWER_KEYS = ["A", "B", "C", "D"] as const;
export type AnswerKey = (typeof ANSWER_KEYS)[number];

/** Category codes in dependency order (Phase 2 priority logic: clarity, product, sales, website, email, content/marketing, automation, productivity). */
export const CATEGORY_DEPENDENCY_ORDER = [
  "foundation",
  "product",
  "email_sales",
  "brand",
  "content",
  "marketing",
  "ai",
  "productivity",
] as const;

/** Category codes in curriculum (module) order. */
export const CATEGORIES = [
  "foundation",
  "brand",
  "content",
  "marketing",
  "product",
  "email_sales",
  "ai",
  "productivity",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  foundation: "Business Foundation",
  brand: "Brand & Website",
  content: "Content Production Engine",
  marketing: "Marketing & Distribution",
  product: "Digital Product Development",
  email_sales: "Email & Sales Systems",
  ai: "AI & Automation Hub",
  productivity: "CEO Productivity System",
};

/** Approved category to module mapping (FINAL_04). */
export const CATEGORY_MODULE: Record<Category, number> = {
  foundation: 1,
  brand: 2,
  content: 3,
  marketing: 4,
  product: 5,
  email_sales: 6,
  ai: 7,
  productivity: 8,
};

export type AuditQuestion = {
  code: string;
  number: number;
  category: Category;
  prompt: string;
  options: { key: AnswerKey; label: string }[];
};

export type AuditVersion = {
  version: number;
  questions: AuditQuestion[];
  /** v1 allows no N/A answers (D13). */
  naAllowed: false;
};

export type Answers = Record<string, AnswerKey>;

export type LearningPath = "build_from_scratch" | "optimize_automate";

/** A published lesson the engine may recommend. Drafts must never be passed in, and are filtered defensively. */
export type CatalogLesson = {
  id: string;
  moduleNumber: number;
  orderIndex: number;
  title: string;
  essential: boolean;
  status: "draft" | "review" | "approved" | "published" | "archived";
};

export type CategoryScore = {
  category: Category;
  earned: number;
  max: number;
  /** Raw precision, 0 to 100. */
  percent: number;
  /** Rounded for display. */
  display: number;
};

export type RecommendedLesson = {
  lessonId: string;
  moduleNumber: number;
  orderIndex: number;
  title: string;
  /** "question": approved question-specific mapping. "category": explicit category-level fallback (D13). */
  mappingLevel: "question" | "category";
};

export type GapKey = "clarity" | "product" | "sales" | "website" | "email";

export type Priority = {
  rank: 1 | 2 | 3;
  kind: "essential_gap" | "lowest_category";
  gap?: GapKey;
  category: Category;
  moduleNumber: number;
  title: string;
  reason: string;
  triggeredBy: string[];
  lessons: RecommendedLesson[];
};

export type RoadmapMonth = {
  month: 1 | 2 | 3 | 4 | 5 | 6;
  theme: string;
  items: {
    title: string;
    reason: string;
    moduleNumber: number | null;
    lessonId: string | null;
    isPriority: boolean;
  }[];
};

export type AuditResult = {
  scoringVersion: string;
  auditVersion: number;
  categoryScores: Record<Category, CategoryScore>;
  overallScore: { percent: number; display: number };
  pathRecommendation: { path: LearningPath; reason: string; triggeredBy: string[] };
  strengths: { category: Category; display: number }[];
  priorityRecommendations: Priority[];
  startingLesson: RecommendedLesson | null;
  roadmapRecommendation: RoadmapMonth[];
  explanations: string[];
};
