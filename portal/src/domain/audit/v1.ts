import source from "./v1.questions.json";
import { ANSWER_KEYS, CATEGORIES, type AuditVersion, type AuditQuestion, type Category } from "./types";

/**
 * Canonical audit v1. Text is imported from the Phase 2 document and must not be edited here.
 * A database test asserts that the seeded questions equal this file.
 */
function load(): AuditVersion {
  const questions = source.questions.map((q): AuditQuestion => {
    if (!(CATEGORIES as readonly string[]).includes(q.category)) {
      throw new Error(`Unknown category ${q.category}`);
    }
    if (q.options.length !== 4 || q.options.some((o, i) => o.key !== ANSWER_KEYS[i])) {
      throw new Error(`Question ${q.code} must have options A to D`);
    }
    return {
      code: q.code,
      number: q.number,
      category: q.category as Category,
      prompt: q.prompt,
      options: q.options as AuditQuestion["options"],
    };
  });
  return { version: source.version, questions, naAllowed: false };
}

export const AUDIT_V1: AuditVersion = load();

export const SECTION_INTROS: Record<Category, string> = {
  foundation: "Who you serve, what you promise, and what you sell.",
  brand: "Your website and how clearly it explains your offer.",
  content: "How you plan, publish, and connect content to your offers.",
  marketing: "How people find your content after you publish it.",
  product: "Where your digital product stands today.",
  email_sales: "Your list, your follow up, and your checkout.",
  ai: "How you use AI and automation today, and how you check the results.",
  productivity: "How you plan your week and track your results.",
};
