import { findField, validateAnswersPatch, type Answers, type WorksheetSchema } from "./schema";

/**
 * A schema's example_response (the hypothetical worked sample in each worksheet file) as saved answers: the label
 * line is dropped, relative dates such as "+7d" count from `now`, and a rating written as { value, note } (Lesson 6)
 * is read as { rating, note }. Then validated like any member's answers, so a bad example fails loudly.
 * Used by tests and the staging journey; not shown to members (see IMPLEMENTATION_ISSUES).
 */
export function exampleAnswers(schema: WorksheetSchema, example: unknown, now: Date): Answers {
  if (!example || typeof example !== "object") return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(example as Record<string, unknown>)) {
    if (key === "label") continue;
    const field = findField(schema, key);
    if (field?.type === "date" && typeof value === "string" && /^\+\d+d$/.test(value)) {
      const d = new Date(now.getTime() + Number(value.slice(1, -1)) * 864e5);
      out[key] = d.toISOString().slice(0, 10);
    } else if (field?.type === "rating" && value && typeof value === "object" && "value" in value && !("rating" in value)) {
      const v = value as { value: string; note?: string };
      out[key] = { rating: v.value, note: v.note ?? "" };
    } else out[key] = value;
  }
  return validateAnswersPatch(schema, out);
}
