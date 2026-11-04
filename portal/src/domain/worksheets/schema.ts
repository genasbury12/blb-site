import { z } from "zod";

/**
 * Worksheet schema (09_IMPLEMENT_WORKSHEETS). One format drives every worksheet: the form, progress, validation of
 * saved answers, the PDF and the admin table. Pure functions only, so the same rules run in the browser and on the
 * server (the server is the trust boundary and re-validates everything).
 */

const fieldBase = {
  key: z.string().regex(/^[a-z0-9_]+(\{k\})?[a-z0-9_]*$/i),
  label: z.string().optional(),
  guide: z.string().optional(),
  example: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  required_for: z.array(z.string()).optional(),
  max_length: z.number().int().positive().max(5000).optional(),
  repeat: z.string().optional(),
};

const fieldSchema = z.discriminatedUnion("type", [
  z.object({ ...fieldBase, type: z.enum(["text", "textarea", "date"]) }),
  z.object({ ...fieldBase, type: z.literal("rating"), note_required: z.boolean().optional() }),
  z.object({ ...fieldBase, type: z.literal("choice"), options: z.array(z.string()).min(1), option_label_from: z.string().optional() }),
  z.object({
    ...fieldBase,
    type: z.literal("sentence"),
    template: z.string(),
    slots: z.array(z.object({ key: z.string().regex(/^[a-z0-9_]+$/), placeholder: z.string().optional(), max_length: z.number().int().positive().max(1000).optional() })).min(1),
  }),
]);
export type WorksheetField = z.infer<typeof fieldSchema>;

const callbackSchema = z.object({ worksheet: z.string(), field: z.string(), label: z.string().optional() });

const subsectionSchema = z.object({
  key: z.string(),
  title: z.string().optional(),
  ask: z.string().optional(),
  guide: z.string().optional(),
  fields: z.array(fieldSchema).default([]),
  footer: z.string().optional(),
});

const sectionSchema = subsectionSchema.extend({
  number: z.string().optional(),
  subsections: z.array(subsectionSchema).optional(),
  callback: callbackSchema.optional(),
});
export type WorksheetSection = z.infer<typeof sectionSchema>;
export type WorksheetSubsection = z.infer<typeof subsectionSchema>;

export const worksheetSchemaSchema = z.object({
  slug: z.string(),
  title: z.string(),
  version: z.number().int().positive().optional(),
  intro: z.object({ eyebrow: z.string().optional(), title: z.string(), lead: z.string().optional(), quote: z.string().optional(), notes: z.array(z.string()).optional() }),
  repeat_groups: z.record(z.string(), z.object({ keys: z.array(z.string()).min(1), label_from: z.string().optional() })).optional(),
  rating_options: z.array(z.object({ value: z.string(), label: z.string(), guide: z.string().optional() })).optional(),
  sections: z.array(sectionSchema).min(1),
  completion: z.object({ milestone_label: z.string().optional(), required_fields: z.array(z.string()).default([]) }),
  admin_columns: z.array(z.string()).optional(),
  /** Show "Download all Module N worksheets" on this worksheet (brief: the module PDF is used at Lesson 9). */
  module_download: z.boolean().optional(),
});
export type WorksheetSchema = z.infer<typeof worksheetSchemaSchema>;

export type RatingAnswer = { rating: string | null; note: string };
export type SentenceAnswer = Record<string, string> & { _rendered?: string };
export type AnswerValue = string | RatingAnswer | SentenceAnswer;
export type Answers = Record<string, AnswerValue>;

/** A field with its repeat key resolved (cred_{k} -> cred_A). */
export type ConcreteField = WorksheetField & { key: string; repeatKey?: string; baseKey: string };

export function parseWorksheetSchema(raw: unknown): WorksheetSchema {
  return worksheetSchemaSchema.parse(raw);
}

export function expandField(schema: WorksheetSchema, field: WorksheetField): ConcreteField[] {
  if (!field.repeat) return [{ ...field, baseKey: field.key }];
  const group = schema.repeat_groups?.[field.repeat];
  if (!group) return [];
  return group.keys.map((k) => ({ ...field, key: field.key.replace("{k}", k), repeatKey: k, baseKey: field.key }));
}

/** Every concrete field in the worksheet, in display order. */
export function concreteFields(schema: WorksheetSchema): ConcreteField[] {
  const out: ConcreteField[] = [];
  for (const s of schema.sections) {
    for (const f of s.fields) out.push(...expandField(schema, f));
    for (const sub of s.subsections ?? []) for (const f of sub.fields) out.push(...expandField(schema, f));
  }
  return out;
}

export function isRequired(field: ConcreteField): boolean {
  if (field.required) return true;
  return Boolean(field.repeatKey && field.required_for?.includes(field.repeatKey));
}

export function renderSentence(template: string, values: Record<string, string>): string {
  return template.replace(/\{([a-z0-9_]+)\}/g, (_, k: string) => (values[k] ?? "").trim() || `[${k}]`);
}

/** "idea_{k}" -> the value of idea_A when filled, otherwise "Idea A". */
export function labelFrom(template: string | undefined, key: string, answers: Answers, fallbackWord = "Idea"): string {
  if (!template) return `${fallbackWord} ${key}`;
  const v = answers[template.replace("{k}", key)];
  return typeof v === "string" && v.trim() ? v.trim() : `${fallbackWord} ${key}`;
}

export function isFilled(field: ConcreteField | undefined, value: AnswerValue | undefined): boolean {
  if (!field || value === undefined || value === null) return false;
  switch (field.type) {
    case "rating": {
      const r = value as RatingAnswer;
      if (typeof r !== "object" || !r.rating) return false;
      return field.note_required ? Boolean(r.note?.trim()) : true;
    }
    case "sentence": {
      const s = value as SentenceAnswer;
      return typeof s === "object" && field.slots.every((slot) => Boolean(s[slot.key]?.trim()));
    }
    default:
      return typeof value === "string" && value.trim().length > 0;
  }
}

export type Progress = { done: number; total: number; percent: number; missing: string[] };

/** Percent of completion.required_fields that are filled (the brief's progress rule). */
export function worksheetProgress(schema: WorksheetSchema, answers: Answers): Progress {
  const byKey = new Map(concreteFields(schema).map((f) => [f.key, f]));
  const required = schema.completion.required_fields;
  const missing = required.filter((k) => !isFilled(byKey.get(k), answers[k]));
  const total = required.length;
  const done = total - missing.length;
  return { done, total, missing, percent: total ? Math.round((done / total) * 100) : 100 };
}

export class WorksheetAnswerError extends Error {
  constructor(readonly field: string, message: string) {
    super(message);
    this.name = "WorksheetAnswerError";
  }
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates a partial answers patch against the worksheet and returns a clean copy: unknown keys, wrong types,
 * over-length text and invalid options are rejected; sentence _rendered is always rebuilt server side.
 */
export function validateAnswersPatch(schema: WorksheetSchema, patch: unknown): Answers {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) throw new WorksheetAnswerError("_", "Invalid answers");
  const byKey = new Map(concreteFields(schema).map((f) => [f.key, f]));
  const ratingValues = new Set((schema.rating_options ?? []).map((o) => o.value));
  const out: Answers = {};
  for (const [key, raw] of Object.entries(patch as Record<string, unknown>)) {
    const field = byKey.get(key);
    if (!field) throw new WorksheetAnswerError(key, "Unknown field");
    const max = field.max_length ?? 5000;
    switch (field.type) {
      case "text":
      case "textarea": {
        if (typeof raw !== "string" || raw.length > max) throw new WorksheetAnswerError(key, `Keep this under ${max} characters`);
        out[key] = raw;
        break;
      }
      case "date": {
        if (typeof raw !== "string" || (raw !== "" && !DATE.test(raw))) throw new WorksheetAnswerError(key, "Use a valid date");
        out[key] = raw;
        break;
      }
      case "choice": {
        if (typeof raw !== "string" || (raw !== "" && !field.options.includes(raw))) throw new WorksheetAnswerError(key, "Choose one of the options");
        out[key] = raw;
        break;
      }
      case "rating": {
        const r = raw as Partial<RatingAnswer> | null;
        if (!r || typeof r !== "object") throw new WorksheetAnswerError(key, "Invalid rating");
        const rating = r.rating ?? null;
        if (rating !== null && (typeof rating !== "string" || !ratingValues.has(rating))) throw new WorksheetAnswerError(key, "Choose Strong, Uncertain, or Weak");
        const note = r.note ?? "";
        if (typeof note !== "string" || note.length > max) throw new WorksheetAnswerError(key, `Keep this under ${max} characters`);
        out[key] = { rating, note };
        break;
      }
      case "sentence": {
        const s = raw as Record<string, unknown> | null;
        if (!s || typeof s !== "object") throw new WorksheetAnswerError(key, "Invalid sentence");
        const clean: Record<string, string> = {};
        for (const slot of field.slots) {
          const v = s[slot.key] ?? "";
          if (typeof v !== "string" || v.length > (slot.max_length ?? 500)) throw new WorksheetAnswerError(key, `Keep each part under ${slot.max_length ?? 500} characters`);
          clean[slot.key] = v;
        }
        out[key] = { ...clean, _rendered: renderSentence(field.template, clean) };
        break;
      }
    }
  }
  return out;
}

/** Readable text for an answer: callbacks, PDF and admin views. */
export function answerText(field: ConcreteField | undefined, value: AnswerValue | undefined, schema?: WorksheetSchema): string {
  if (!field || value === undefined || value === null) return "";
  if (field.type === "sentence") return (value as SentenceAnswer)._rendered ?? "";
  if (field.type === "rating") {
    const r = value as RatingAnswer;
    const label = schema?.rating_options?.find((o) => o.value === r.rating)?.label ?? r.rating ?? "";
    return [label, r.note].filter(Boolean).join(": ");
  }
  return typeof value === "string" ? value : "";
}

/** Find a concrete field by key anywhere in the worksheet. */
export function findField(schema: WorksheetSchema, key: string): ConcreteField | undefined {
  return concreteFields(schema).find((f) => f.key === key);
}
