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
  /** Start an empty field with an earlier worksheet's answer, e.g. Lesson 3 theme_{k} into problem_{k} (Lesson 4). */
  prefill_from: z.object({ worksheet: z.string(), field: z.string() }).optional(),
};

const fieldSchema = z.discriminatedUnion("type", [
  z.object({ ...fieldBase, type: z.enum(["text", "textarea", "date"]) }),
  z.object({ ...fieldBase, type: z.literal("rating"), note_required: z.boolean().optional(), note_placeholder: z.string().optional() }),
  z.object({
    ...fieldBase,
    type: z.literal("choice"),
    /** Inline options (plain values, or value/label/guide objects), or `options_from` naming a top level list. */
    options: z.array(z.union([z.string(), z.object({ value: z.string(), label: z.string(), guide: z.string().optional() })])).min(1).optional(),
    options_from: z.string().optional(),
    option_label_from: z.string().optional(),
  }),
  /**
   * Tick any number of options, stored as an array of values: a repeat group's rows with content (Lesson 3: which
   * observations support a theme) or an inline list (Lesson 8: which pieces exist).
   */
  z.object({
    ...fieldBase,
    type: z.literal("multichoice"),
    options_from_repeat: z.string().optional(),
    options: z.array(z.object({ value: z.string(), label: z.string(), guide: z.string().optional() })).min(1).optional(),
  }),
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
  /** Not needed to finish: collapsed behind a "Show" toggle (Lesson 9 "If you already have a business"). */
  optional: z.boolean().optional(),
  /** Earlier answers quoted inside this section, above its fields (Lesson 9 section 4 quotes Lesson 1). */
  callbacks_inline: z.array(z.object({ source_worksheet: z.string(), source_field: z.string(), heading: z.string() })).optional(),
});
export type WorksheetSection = z.infer<typeof sectionSchema>;
export type WorksheetSubsection = z.infer<typeof subsectionSchema>;

const optionSchema = z.object({ value: z.string(), label: z.string(), guide: z.string().optional() });
export type WorksheetOption = z.infer<typeof optionSchema>;

const repeatGroupSchema = z.object({
  keys: z.array(z.string()).min(1),
  /** Column heading from another answer, e.g. "idea_{k}" (Lesson 2). */
  label_from: z.string().optional(),
  /** Row heading, e.g. "Observation {k}". A group with a label renders as one card per row. */
  label: z.string().optional(),
  /** Variable length: show this many rows first; `add_label` reveals the next one, up to every key. */
  min_visible: z.number().int().positive().optional(),
  add_label: z.string().optional(),
});
export type RepeatGroup = z.infer<typeof repeatGroupSchema>;

/** A quote from an earlier worksheet shown before section 1 (Lesson 3: "Where you started"). */
const topCallbackSchema = z.object({
  key: z.string(),
  source_worksheet: z.string(),
  source_field: z.string(),
  heading: z.string(),
  /** {slot} tokens are the source sentence's slots; {value} is the source answer as text. Default "{value}". */
  template: z.string().default("{value}"),
  missing_text: z.string().default(""),
});
export type TopCallback = z.infer<typeof topCallbackSchema>;

const adminCountSchema = z
  .object({
    label: z.string(),
    count_filled: z.string().optional(),
    tally: z.string().optional(),
    /** Members with at least one matching answer, e.g. any help_{k} rated weak (Lesson 4). */
    count_value: z.object({ field: z.string(), rating: z.string().optional(), value: z.string().optional() }).optional(),
  })
  .refine((c) => [c.count_filled, c.tally, c.count_value].filter(Boolean).length === 1, "Give one of count_filled, tally or count_value");

const worksheetObjectSchema = z.object({
  slug: z.string(),
  title: z.string(),
  version: z.number().int().positive().optional(),
  intro: z.object({ eyebrow: z.string().optional(), title: z.string(), lead: z.string().optional(), quote: z.string().optional(), notes: z.array(z.string()).optional() }),
  repeat_groups: z.record(z.string(), repeatGroupSchema).optional(),
  rating_options: z.array(optionSchema).optional(),
  /**
   * Named choice lists (not ratings): every top level key ending in "_options" (confidence_options, format_options,
   * stage_options, verdict_options, ...), gathered here when the schema is parsed. Choice fields name one with
   * options_from.
   */
  option_lists: z.record(z.string(), z.array(optionSchema).min(1)).default({}),
  callbacks: z.array(topCallbackSchema).optional(),
  sections: z.array(sectionSchema).min(1),
  completion: z.object({ milestone_label: z.string().optional(), required_fields: z.array(z.string()).default([]) }),
  admin_columns: z.array(z.string()).optional(),
  /** Show "Download all Module N worksheets" on this worksheet (brief: the module PDF is used at Lesson 9). */
  module_download: z.boolean().optional(),
  /** A short closing line printed in muted text at the end of the worksheet's PDF (owner addition 2026-11-04). */
  footer_note: z.string().trim().min(1).max(300).optional(),
  /**
   * Lesson 9: each numbered callback ("1. Business direction") is a card in section 1 holding that decision's
   * fields (dec_1, ev_1, note_1); unnumbered callbacks join the card before them. Any text here turns it on.
   */
  callback_layout: z.string().optional(),
  /** The PDF as a document of its own (Lesson 9 Blueprint): a cover sentence, the quotes, the module bundle. */
  pdf: z
    .object({ title: z.string().optional(), include_callbacks: z.boolean().optional(), cover_sentence_field: z.string().optional(), bundle_label: z.string().optional() })
    .optional(),
  /** Extra tiles on the admin worksheet page: filled rows per member, or a tally of a choice field's values. */
  admin_counts: z.array(adminCountSchema).optional(),
  /** Keys later worksheets quote. Nothing reads it yet; kept so the keys stay stable (tested). */
  callbacks_provided: z.record(z.string(), z.string()).optional(),
}).superRefine((ws, ctx) => {
  const lists: Record<string, unknown> = { rating_options: ws.rating_options, ...ws.option_lists };
  const all = [...ws.sections.flatMap((s) => [...s.fields, ...(s.subsections ?? []).flatMap((sub) => sub.fields)])];
  for (const f of all) {
    if (f.repeat && !ws.repeat_groups?.[f.repeat]) ctx.addIssue({ code: "custom", message: `${f.key}: unknown repeat group ${f.repeat}` });
    if (f.type === "choice" && !f.options && !(f.options_from && Array.isArray(lists[f.options_from])))
      ctx.addIssue({ code: "custom", message: `${f.key}: give options, or options_from naming a declared option list` });
    if (f.type === "multichoice" && !f.options && !(f.options_from_repeat && ws.repeat_groups?.[f.options_from_repeat]))
      ctx.addIssue({ code: "custom", message: `${f.key}: unknown repeat group ${f.options_from_repeat}` });
  }
  for (const [name, g] of Object.entries(ws.repeat_groups ?? {}))
    if (g.min_visible && g.min_visible > g.keys.length) ctx.addIssue({ code: "custom", message: `${name}: min_visible is more than its keys` });
});

/** Strong, Uncertain, Weak: the rating words every worksheet uses when it does not list its own. */
export const DEFAULT_RATING_OPTIONS = [
  { value: "strong", label: "Strong" },
  { value: "uncertain", label: "Uncertain" },
  { value: "weak", label: "Weak" },
];

/** The worksheet format, with every top level "*_options" list gathered into option_lists before validation. */
export const worksheetSchemaSchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const named = Object.entries(raw as Record<string, unknown>).filter(([k, v]) => k.endsWith("_options") && k !== "rating_options" && Array.isArray(v));
  const r = raw as Record<string, unknown>;
  return {
    ...r,
    // Lessons 5 and 6 rate without their own list: the same three words, without guides.
    rating_options: r.rating_options ?? DEFAULT_RATING_OPTIONS,
    option_lists: { ...Object.fromEntries(named), ...((r.option_lists as object | undefined) ?? {}) },
  };
}, worksheetObjectSchema);
export type WorksheetSchema = z.infer<typeof worksheetSchemaSchema>;

export type RatingAnswer = { rating: string | null; note: string };
export type SentenceAnswer = Record<string, string> & { _rendered?: string };
export type AnswerValue = string | string[] | RatingAnswer | SentenceAnswer;
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
  const sub = (v: string | undefined, k: string) => (v === undefined ? v : v.replaceAll("{k}", k));
  return group.keys.map((k) => ({ ...field, key: field.key.replace("{k}", k), label: sub(field.label, k), placeholder: sub(field.placeholder, k), repeatKey: k, baseKey: field.key }));
}

/** The options a choice field offers: its own list, or the top level list it names (options_from). */
export function choiceOptions(schema: WorksheetSchema, field: Extract<WorksheetField, { type: "choice" }>): WorksheetOption[] {
  if (field.options) return field.options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const list = field.options_from === "rating_options" ? schema.rating_options : field.options_from ? schema.option_lists[field.options_from] : undefined;
  return list ?? [];
}

/** Every value a multichoice may store, in display order. */
export function multichoiceValues(schema: WorksheetSchema, field: Extract<WorksheetField, { type: "multichoice" }>): string[] {
  if (field.options) return field.options.map((o) => o.value);
  return field.options_from_repeat ? (schema.repeat_groups?.[field.options_from_repeat]?.keys ?? []) : [];
}

/** Every concrete field in one row of a repeat group, in display order (ev_said_3, ev_source_3, ...). */
export function repeatRow(schema: WorksheetSchema, group: string, key: string): ConcreteField[] {
  return concreteFields(schema).filter((f) => f.repeat === group && f.repeatKey === key);
}

/** A row "has content" when any of its fields is filled. */
export function rowHasContent(schema: WorksheetSchema, group: string, key: string, answers: Answers): boolean {
  return repeatRow(schema, group, key).some((f) => isFilled(f, answers[f.key]));
}

/** The rows a multichoice offers: rows of its group with content, labelled "k" plus the first 60 characters of the row's first field. */
export function repeatOptions(schema: WorksheetSchema, group: string, answers: Answers): { key: string; label: string }[] {
  return (schema.repeat_groups?.[group]?.keys ?? [])
    .filter((k) => rowHasContent(schema, group, k, answers))
    .map((k) => {
      const first = repeatRow(schema, group, k)[0];
      const raw = first ? answers[first.key] : undefined;
      const text = typeof raw === "string" ? raw.trim().replace(/\s+/g, " ") : "";
      return { key: k, label: text.length > 60 ? `${text.slice(0, 60).trimEnd()}\u2026` : text };
    });
}

/** How many rows of a group to show: min_visible, or more when a later row already has content. */
export function visibleRows(schema: WorksheetSchema, group: string, answers: Answers): number {
  const g = schema.repeat_groups?.[group];
  if (!g) return 0;
  if (!g.min_visible) return g.keys.length;
  let last = 0;
  g.keys.forEach((k, i) => {
    if (rowHasContent(schema, group, k, answers)) last = i + 1;
  });
  return Math.max(g.min_visible, last);
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
/** A repeat column's heading: the answer its label_from names, else its label ("Problem 1"), else "Idea A". */
export function groupHeading(group: RepeatGroup | undefined, key: string, answers: Answers): string {
  const fallback = group?.label ? group.label.replaceAll("{k}", key) : `Idea ${key}`;
  const v = group?.label_from ? answers[group.label_from.replace("{k}", key)] : undefined;
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

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
      return typeof s === "object" && !Array.isArray(s) && field.slots.every((slot) => Boolean(s[slot.key]?.trim()));
    }
    case "multichoice":
      return Array.isArray(value) && value.length > 0;
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
        if (typeof raw !== "string" || (raw !== "" && !choiceOptions(schema, field).some((o) => o.value === raw))) throw new WorksheetAnswerError(key, "Choose one of the options");
        out[key] = raw;
        break;
      }
      case "multichoice": {
        const allowed = multichoiceValues(schema, field);
        if (!Array.isArray(raw) || raw.some((v) => typeof v !== "string" || !allowed.includes(v)) || new Set(raw).size !== raw.length)
          throw new WorksheetAnswerError(key, field.options ? "Choose from the options" : "Choose from your observations");
        // Stored in the group's own order, so "1, 2" reads the same however they were ticked.
        out[key] = allowed.filter((k) => raw.includes(k));
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
  if (field.type === "multichoice") {
    if (!Array.isArray(value)) return "";
    // Inline options read as their labels; rows of a repeat group as their numbers ("1, 2").
    return field.options ? value.map((v) => field.options!.find((o) => o.value === v)?.label ?? v).join(", ") : value.join(", ");
  }
  if (field.type === "choice" && typeof value === "string" && schema && !field.option_label_from) return choiceOptions(schema, field).find((o) => o.value === value)?.label ?? value;
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
