import { answerText, concreteFields, findField, isFilled, type Answers, type SentenceAnswer, type WorksheetSchema } from "./schema";

/**
 * Quotes from a member's earlier worksheets (brief: callbacks). Two kinds:
 *  - a section callback (Lesson 9 placeholder): the source answer, shown once it is filled in;
 *  - a top callback (Lesson 3 "Where you started"): a template filled from the source answer, shown only when the
 *    source worksheet is complete, otherwise the schema's missing_text. The member can always keep working.
 * Pure, so the lesson page, the PDF route and the data export resolve them the same way.
 */

/**
 * Keys later worksheets use for an earlier worksheet, mapped to the keys it was seeded with (owner decision
 * 2026-11-05: map, do not rename). Lesson 1 was seeded as q1, q2, q3; brief 18 names them by meaning.
 */
export const SOURCE_KEY_ALIASES: Record<string, Record<string, string>> = {
  "m1-l1-starting-point": { q1_treating_as_business: "q1", q2_pay_for: "q2", q3_blog_disappeared: "q3" },
};

/** The source worksheet's own key for a field a callback names. */
export function sourceKey(worksheet: string, field: string): string {
  return SOURCE_KEY_ALIASES[worksheet]?.[field] ?? field;
}

export type CallbackSource = { title: string; schema: WorksheetSchema; answers: Answers; status: "in_progress" | "complete" };
export type SectionCallbacks = Record<string, { label: string; text: string }>;
export type ResolvedTopCallback = { key: string; heading: string; text: string | null; missingText: string };
/** A quote inside a section (callbacks_inline): shown once the earlier answer is filled in. */
export type InlineCallback = { key: string; heading: string; text: string | null; source: string };

export function callbackSourceSlugs(schema: WorksheetSchema): string[] {
  const slugs = [
    ...schema.sections.flatMap((s) => (s.callback ? [s.callback.worksheet] : [])),
    ...(schema.callbacks ?? []).map((c) => c.source_worksheet),
    ...schema.sections.flatMap((s) => (s.callbacks_inline ?? []).map((c) => c.source_worksheet)),
    ...concreteFields(schema).flatMap((f) => (f.prefill_from ? [f.prefill_from.worksheet] : [])),
  ];
  return [...new Set(slugs)];
}

/**
 * Starting values for empty fields with prefill_from (Lesson 4: problem_{k} from Lesson 3 theme_{k}), from the
 * member's own earlier answers. Only text answers are copied; a field that already has an answer keeps it.
 */
export function prefillAnswers(schema: WorksheetSchema, answers: Answers, sources: Map<string, CallbackSource>): Answers {
  const out: Answers = {};
  for (const f of concreteFields(schema)) {
    if (!f.prefill_from || isFilled(f, answers[f.key])) continue;
    const src = sources.get(f.prefill_from.worksheet);
    const key = sourceKey(f.prefill_from.worksheet, f.prefill_from.field.replace("{k}", f.repeatKey ?? ""));
    const v = src?.answers[key];
    if (typeof v === "string" && v.trim()) out[f.key] = f.max_length ? v.trim().slice(0, f.max_length) : v.trim();
  }
  return out;
}

/** Fills a callback template from the source answer: sentence slots by name, otherwise the whole answer. */
export function fillCallbackTemplate(template: string, source: CallbackSource, field: string): string | null {
  const f = findField(source.schema, field);
  const value = source.answers[field];
  const whole = answerText(f, value, source.schema).trim();
  if (!f || !whole) return null;
  const slots: Record<string, string> = f.type === "sentence" ? Object.fromEntries(Object.entries(value as SentenceAnswer).filter(([k]) => k !== "_rendered")) : {};
  let missing = false;
  const text = template.replace(/\{([a-z0-9_]+)\}/gi, (_, k: string) => {
    // A sentence source fills by slot ({person}); any other source is one answer, whatever the token is called
    // ({value}, {answer}, or the field's own name such as {priority_problem}).
    const v = (f.type === "sentence" && k !== "value" && k !== "answer" ? (slots[k] ?? "") : whole).trim();
    if (!v) missing = true;
    return v;
  });
  return missing ? null : text;
}

export function resolveCallbacks(
  schema: WorksheetSchema,
  sources: Map<string, CallbackSource>,
): { sections: SectionCallbacks; top: ResolvedTopCallback[]; inline: Record<string, InlineCallback[]> } {
  const sections: SectionCallbacks = {};
  for (const section of schema.sections) {
    const cb = section.callback;
    const src = cb ? sources.get(cb.worksheet) : undefined;
    if (!cb || !src) continue;
    const text = answerText(findField(src.schema, cb.field), src.answers[cb.field], src.schema).trim();
    if (text) sections[section.key] = { label: cb.label ?? src.title, text };
  }
  const top = (schema.callbacks ?? []).map((cb) => {
    const src = sources.get(cb.source_worksheet);
    const text = src && src.status === "complete" ? fillCallbackTemplate(cb.template, src, sourceKey(cb.source_worksheet, cb.source_field)) : null;
    return { key: cb.key, heading: cb.heading, text, missingText: cb.missing_text };
  });
  const inline: Record<string, InlineCallback[]> = {};
  for (const section of schema.sections) {
    if (!section.callbacks_inline?.length) continue;
    inline[section.key] = section.callbacks_inline.map((cb) => {
      const src = sources.get(cb.source_worksheet);
      const key = sourceKey(cb.source_worksheet, cb.source_field);
      const text = src ? answerText(findField(src.schema, key), src.answers[key], src.schema).trim() || null : null;
      return { key: `${cb.source_worksheet}.${cb.source_field}`, heading: cb.heading, text, source: src?.title ?? "an earlier worksheet" };
    });
  }
  return { sections, top, inline };
}

export type CallbackGroup = { key: string; heading: string; lines: string[]; missingText: string };

/**
 * Top callbacks as shown: one with an empty heading joins the group above it (Lesson 4 quotes three problems and the
 * snapshot in two boxes). A group with no quoted line shows its first missing_text, or nothing when that is empty.
 */
export function groupTopCallbacks(top: ResolvedTopCallback[]): CallbackGroup[] {
  const groups: CallbackGroup[] = [];
  for (const cb of top) {
    const last = groups[groups.length - 1];
    if (cb.heading || !last) groups.push({ key: cb.key, heading: cb.heading, lines: cb.text ? [cb.text] : [], missingText: cb.missingText });
    else if (cb.text) last.lines.push(cb.text);
  }
  return groups;
}

export type DecisionCard = { n: string; key: string; heading: string; text: string | null; missingText: string; extras: ResolvedTopCallback[] };

/**
 * callback_layout (Lesson 9): a callback whose heading starts with a number ("3. The priority problem") opens a
 * card for decision 3; the callbacks after it until the next number ("Your decision rule was") are extra quoted
 * lines in that card.
 */
export function decisionCards(top: ResolvedTopCallback[]): DecisionCard[] {
  const cards: DecisionCard[] = [];
  for (const cb of top) {
    const n = cb.heading.match(/^(\d+)\./)?.[1];
    if (n) cards.push({ n, key: cb.key, heading: cb.heading, text: cb.text, missingText: cb.missingText, extras: [] });
    else cards[cards.length - 1]?.extras.push(cb);
  }
  return cards;
}
