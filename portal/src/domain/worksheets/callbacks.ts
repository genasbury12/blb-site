import { answerText, findField, type Answers, type SentenceAnswer, type WorksheetSchema } from "./schema";

/**
 * Quotes from a member's earlier worksheets (brief: callbacks). Two kinds:
 *  - a section callback (Lesson 9 placeholder): the source answer, shown once it is filled in;
 *  - a top callback (Lesson 3 "Where you started"): a template filled from the source answer, shown only when the
 *    source worksheet is complete, otherwise the schema's missing_text. The member can always keep working.
 * Pure, so the lesson page, the PDF route and the data export resolve them the same way.
 */

export type CallbackSource = { title: string; schema: WorksheetSchema; answers: Answers; status: "in_progress" | "complete" };
export type SectionCallbacks = Record<string, { label: string; text: string }>;
export type ResolvedTopCallback = { key: string; heading: string; text: string | null; missingText: string };

export function callbackSourceSlugs(schema: WorksheetSchema): string[] {
  const slugs = [...schema.sections.flatMap((s) => (s.callback ? [s.callback.worksheet] : [])), ...(schema.callbacks ?? []).map((c) => c.source_worksheet)];
  return [...new Set(slugs)];
}

/** "{person}" tokens from the source sentence's slots, "{answer}" from the source answer as text. */
export function fillCallbackTemplate(template: string, source: CallbackSource, field: string): string | null {
  const f = findField(source.schema, field);
  const value = source.answers[field];
  const whole = answerText(f, value, source.schema).trim();
  if (!f || !whole) return null;
  const slots: Record<string, string> = f.type === "sentence" ? Object.fromEntries(Object.entries(value as SentenceAnswer).filter(([k]) => k !== "_rendered")) : {};
  let missing = false;
  const text = template.replace(/\{([a-z0-9_]+)\}/gi, (_, k: string) => {
    const v = (k === "answer" ? whole : (slots[k] ?? "")).trim();
    if (!v) missing = true;
    return v;
  });
  return missing ? null : text;
}

export function resolveCallbacks(schema: WorksheetSchema, sources: Map<string, CallbackSource>): { sections: SectionCallbacks; top: ResolvedTopCallback[] } {
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
    const text = src && src.status === "complete" ? fillCallbackTemplate(cb.template, src, cb.source_field) : null;
    return { key: cb.key, heading: cb.heading, text, missingText: cb.missing_text };
  });
  return { sections, top };
}
