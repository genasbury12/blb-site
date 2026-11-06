import {
  answerText,
  choiceOptions,
  expandField,
  findField,
  validateAnswersPatch,
  type Answers,
  type AnswerValue,
  type ConcreteField,
  type RatingAnswer,
  type SentenceAnswer,
  type WorksheetSchema,
  type WorksheetSection,
} from "./schema";

/**
 * A schema's example_response (the hypothetical worked sample in each worksheet file) as saved answers: the label
 * line is dropped, relative dates such as "+7d" count from `now`, and a rating written as { value, note } (Lesson 6)
 * is read as { rating, note }. Then validated like any member's answers, so a bad example fails loudly.
 * Used by tests and the staging journey.
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

export type ExampleLine = { key: string; label: string; text: string };

/** "+7d" reads as "7 days from today"; a real date as itself. */
function exampleDate(v: string) {
  const m = v.match(/^\+(\d+)d$/);
  return m ? `${m[1]} ${m[1] === "1" ? "day" : "days"} from today` : v;
}

function exampleText(field: ConcreteField, value: unknown, schema: WorksheetSchema, ex: Record<string, unknown>): string {
  if (value === undefined || value === null || value === "") return "";
  switch (field.type) {
    case "date":
      return typeof value === "string" ? exampleDate(value) : "";
    case "rating": {
      // Lesson 6's example writes { value, note }; the others { rating, note }.
      const r = value as Partial<RatingAnswer> & { value?: string };
      const word = schema.rating_options?.find((o) => o.value === (r.rating ?? r.value))?.label ?? r.rating ?? r.value ?? "";
      return [word, r.note].filter(Boolean).join(": ");
    }
    case "sentence": {
      const slots = value as SentenceAnswer;
      return field.template.replace(/\{([a-z0-9_]+)\}/g, (_, k: string) => (slots[k] ?? "").trim() || k);
    }
    case "choice":
      if (field.option_label_from) {
        const named = ex[field.option_label_from.replace("{k}", String(value))];
        return typeof named === "string" && named.trim() ? `${value}: ${named.trim()}` : String(value);
      }
      return choiceOptions(schema, field).find((o) => o.value === value)?.label ?? String(value);
    case "multichoice": {
      const text = Array.isArray(value) ? answerText(field, value as AnswerValue, schema) : "";
      return text && field.options_from_repeat ? `Observations ${text}` : text;
    }
    default:
      return typeof value === "string" ? value : "";
  }
}

/**
 * The worked example for one section, as label and text pairs in the section's order (repeat rows labelled
 * "Observation 1: What she said or did"). Empty when the schema has no example or the section has none of it.
 */
export function sectionExample(schema: WorksheetSchema, section: WorksheetSection): ExampleLine[] {
  const ex = schema.example_response;
  if (!ex) return [];
  const fields = [...section.fields, ...(section.subsections ?? []).flatMap((x) => x.fields)];
  const out: ExampleLine[] = [];
  for (const f of fields) {
    const group = f.repeat ? schema.repeat_groups?.[f.repeat] : undefined;
    for (const c of expandField(schema, f)) {
      const text = exampleText(c, ex[c.key], schema, ex).trim();
      if (!text) continue;
      const row = c.repeatKey && group?.label ? group.label.replaceAll("{k}", c.repeatKey) : c.repeatKey && !group?.label ? `${group?.label_from ? "" : "Row "}${c.repeatKey}` : "";
      const label = c.label ?? c.key;
      out.push({ key: c.key, label: row && !label.includes(c.repeatKey!) ? `${row}: ${label}` : label, text });
    }
  }
  return out;
}

/** The example's own caption (e.g. "Hypothetical example shown to students as a worked sample. Not real people."). */
export function exampleCaption(schema: WorksheetSchema): string | null {
  const label = schema.example_response?.label;
  return typeof label === "string" && label.trim() ? label.trim() : null;
}
