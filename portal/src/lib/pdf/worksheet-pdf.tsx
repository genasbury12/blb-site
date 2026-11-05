import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { ResolvedTopCallback } from "@/domain/worksheets/callbacks";
import {
  answerText,
  choiceOptions,
  expandField,
  isFilled,
  isRequired,
  labelFrom,
  rowHasContent,
  type Answers,
  type ConcreteField,
  type RatingAnswer,
  type SentenceAnswer,
  type WorksheetField,
  type WorksheetSchema,
} from "@/domain/worksheets/schema";
import { PDF_FONTS as F, renderWithFreshFonts } from "./brand-fonts";

/**
 * Branded worksheet PDF (09_IMPLEMENT_WORKSHEETS, Slice C). Brand fonts from ./brand-fonts (Cormorant Garamond
 * display, DM Sans body), read from disk. Built only from the member's saved answers; never logged.
 */
const C = { plum: "#65474F", ink: "#30282C", muted: "#5A4A50", mauve: "#A56C78", mauveInk: "#80505B", rose: "#E8C8CB", roseDeep: "#D4A5AB", ivory: "#F7EEE9", field: "#FBF6F3", fieldBorder: "#E6D9D9" };

const s = StyleSheet.create({
  page: { paddingTop: 48, paddingBottom: 64, paddingHorizontal: 54, backgroundColor: C.ivory, color: C.ink, fontFamily: F.body, fontSize: 10, lineHeight: 1.5 },
  brand: { fontFamily: F.display, fontSize: 13.5, color: C.plum, letterSpacing: 0.4 },
  rule: { height: 1, backgroundColor: C.rose, marginVertical: 12 },
  eyebrow: { fontSize: 7.5, letterSpacing: 1.6, color: C.mauveInk, textTransform: "uppercase" },
  title: { fontFamily: F.display, fontSize: 33, marginTop: 6, lineHeight: 1.15 },
  titleLast: { fontFamily: F.displayItalic, color: C.mauve },
  meta: { fontSize: 8.5, color: C.muted, marginTop: 6 },
  section: { marginTop: 26, flexDirection: "row" },
  number: { fontFamily: F.display, fontSize: 33, color: C.roseDeep, width: 38, lineHeight: 1 },
  sectionBody: { flex: 1 },
  // Everything after a section's first answer, lined up under its heading (the number column is 38pt wide).
  sectionRest: { marginLeft: 38 },
  h2: { fontFamily: F.display, fontSize: 20, lineHeight: 1.2 },
  ask: { fontFamily: F.displayItalic, fontSize: 13, color: C.mauveInk, marginTop: 2 },
  h3: { fontFamily: F.display, fontSize: 15.5, marginTop: 14 },
  rowHead: { fontSize: 7.5, letterSpacing: 1.4, color: C.mauveInk, textTransform: "uppercase", marginTop: 14 },
  // One observation (or problem) as one compact card, as on the form.
  rowCard: { backgroundColor: C.field, borderColor: C.fieldBorder, borderWidth: 1, borderRadius: 7, paddingVertical: 4, paddingHorizontal: 10, marginTop: 3 },
  rowLabel: { fontFamily: F.bodyBold, fontSize: 8, color: C.mauveInk, marginTop: 5 },
  rowGuide: { fontSize: 7.5, color: C.muted, lineHeight: 1.35 },
  rowValue: { marginBottom: 1 },
  label: { fontFamily: F.bodyBold, fontSize: 9, marginTop: 10, marginBottom: 3 },
  // The question's guide line, muted as on the form (owner decision 2026-11-04).
  guide: { fontSize: 8.5, color: C.muted, marginTop: -1, marginBottom: 4, lineHeight: 1.4 },
  block: { backgroundColor: C.field, borderColor: C.fieldBorder, borderWidth: 1, borderRadius: 7, paddingVertical: 8, paddingHorizontal: 10 },
  empty: { fontFamily: F.bodyItalic, color: C.muted },
  ratingWord: { fontFamily: F.bodyBold },
  sentence: { fontFamily: F.display, fontSize: 20, lineHeight: 1.35, color: C.plum },
  quote: { borderLeftColor: C.roseDeep, borderLeftWidth: 2, paddingLeft: 10, marginTop: 10 },
  quoteText: { fontFamily: F.displayItalic, fontSize: 14.5, color: C.plum },
  footerNote: { marginTop: 28, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.rose, fontFamily: F.bodyItalic, fontSize: 9, color: C.muted },
  // Two separately positioned lines: react-pdf drops a fixed, absolutely positioned row container.
  footerLeft: { position: "absolute", bottom: 26, left: 54, fontSize: 7.5, color: C.muted },
  footerRight: { position: "absolute", bottom: 26, right: 54, fontSize: 7.5, color: C.muted, textAlign: "right" },
});

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" });
const RATING_COLOR: Record<string, string> = { strong: C.plum, uncertain: C.mauveInk, weak: C.mauve };

export type WorksheetPdfInput = {
  schema: WorksheetSchema;
  answers: Answers;
  moduleNumber: number;
  lessonNumber: number;
  memberName: string | null;
  completedAt: string | null;
  callbacks?: Record<string, { label: string; text: string }>;
  /** Quotes before section 1 (Lesson 3 "Where you started"); printed only when the quote is there. */
  topCallbacks?: ResolvedTopCallback[];
};

function fmtDate(v: string) {
  const d = new Date(`${v}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? v : dateFmt.format(d);
}

function Answer({ field, value, schema, answers }: { field: ConcreteField; value: Answers[string] | undefined; schema: WorksheetSchema; answers: Answers }) {
  if (!isFilled(field, value) && !(field.type === "rating" && (value as RatingAnswer | undefined)?.rating)) {
    return (
      <View style={s.block} wrap={false}>
        <Text style={s.empty}>Not answered</Text>
      </View>
    );
  }
  switch (field.type) {
    case "rating": {
      const r = value as RatingAnswer;
      const word = schema.rating_options?.find((o) => o.value === r.rating)?.label ?? r.rating ?? "";
      return (
        <View style={s.block}>
          <Text>
            <Text style={[s.ratingWord, { color: RATING_COLOR[r.rating ?? ""] ?? C.ink }]}>{word}</Text>
            {r.note?.trim() ? `  ${r.note.trim()}` : ""}
          </Text>
        </View>
      );
    }
    case "sentence":
      return (
        <View style={s.block}>
          <Text style={s.sentence}>{(value as SentenceAnswer)._rendered ?? ""}</Text>
        </View>
      );
    case "choice":
      return (
        <View style={s.block}>
          <Text>
            {field.option_label_from
              ? labelFrom(field.option_label_from, value as string, answers)
              : (choiceOptions(schema, field).find((o) => o.value === value)?.label ?? (value as string))}
          </Text>
        </View>
      );
    case "multichoice":
      return (
        <View style={s.block}>
          <Text>{rowAnswer(field, answers, schema)}</Text>
        </View>
      );
    case "date":
      return (
        <View style={s.block}>
          <Text>{fmtDate(value as string)}</Text>
        </View>
      );
    default:
      return (
        <View style={s.block}>
          <Text>{answerText(field, value, schema)}</Text>
        </View>
      );
  }
}

/** Question types whose guide line the form shows under the question; the PDF prints the same ones. */
const GUIDED = new Set(["text", "textarea", "date"]);

/** Print required fields always (as "Not answered" when empty) and optional ones only when answered. */
function printable(c: ConcreteField, answers: Answers) {
  return isRequired(c) || isFilled(c, answers[c.key]) || Boolean((answers[c.key] as RatingAnswer | undefined)?.rating);
}

type PrintItem = { kind: "field"; field: ConcreteField; label: string } | { kind: "row"; key: string; heading: string; fields: ConcreteField[] };

/**
 * What a list of schema fields prints as. Labelled repeat groups print row by row (a variable length group only
 * the rows with content, brief 11); other repeat fields print one block per idea the member used.
 */
function printPlan(fields: WorksheetField[], schema: WorksheetSchema, answers: Answers, context?: string): PrintItem[] {
  const out: PrintItem[] = [];
  const carded = new Set<string>();
  for (const f of fields) {
    const group = f.repeat ? schema.repeat_groups?.[f.repeat] : undefined;
    if (f.repeat && group?.label) {
      if (carded.has(f.repeat)) continue;
      carded.add(f.repeat);
      const members = fields.filter((x) => x.repeat === f.repeat);
      for (const k of group.keys) {
        const row = members.map((m) => expandField(schema, m).find((c) => c.repeatKey === k)).filter((c): c is ConcreteField => Boolean(c));
        const content = rowHasContent(schema, f.repeat, k, answers);
        if (group.min_visible ? !content : !row.some((c) => printable(c, answers))) continue;
        out.push({ kind: "row", key: k, heading: group.label.replaceAll("{k}", k), fields: row.filter((c) => printable(c, answers)) });
      }
      continue;
    }
    for (const c of expandField(schema, f)) {
      // Repeat columns: print the ideas the member actually used (plus any required one).
      if (!printable(c, answers)) continue;
      const label = c.repeatKey ? `${context ? `${context}: ` : ""}${labelFrom(group?.label_from, c.repeatKey, answers)}` : (c.label ?? c.key);
      out.push({ kind: "field", field: c, label });
    }
  }
  return out;
}

/** An answer inside a row card, as plain text. */
function rowAnswer(c: ConcreteField, answers: Answers, schema: WorksheetSchema) {
  const v = answers[c.key];
  if (c.type === "date" && typeof v === "string") return fmtDate(v);
  if (c.type === "multichoice" && Array.isArray(v)) return `${v.length === 1 ? "Observation" : "Observations"} ${v.join(", ")}`;
  return answerText(c, v, schema);
}

function FieldBlock({ field, label, schema, answers }: { field: ConcreteField; label: string; schema: WorksheetSchema; answers: Answers }) {
  const length = answerText(field, answers[field.key], schema).length;
  return (
    <View wrap={length > 700} minPresenceAhead={40}>
      <Text style={s.label}>{label}</Text>
      {field.guide && GUIDED.has(field.type) ? <Text style={s.guide}>{field.guide}</Text> : null}
      <Answer field={field} value={answers[field.key]} schema={schema} answers={answers} />
    </View>
  );
}

function PrintItemView({ item, schema, answers }: { item: PrintItem; schema: WorksheetSchema; answers: Answers }) {
  if (item.kind === "field") return <FieldBlock field={item.field} label={item.label} schema={schema} answers={answers} />;
  return (
    <View wrap={false}>
      <Text style={s.rowHead}>{item.heading}</Text>
      <View style={s.rowCard}>
        {item.fields.map((c) => (
          <View key={c.key}>
            {/* "Problem 1" under the heading "Problem 1" says it twice: the heading is enough. */}
            {c.label !== item.heading ? <Text style={s.rowLabel}>{c.label ?? c.key}</Text> : <View style={{ height: 5 }} />}
            {c.guide && GUIDED.has(c.type) ? <Text style={s.rowGuide}>{c.guide}</Text> : null}
            {isFilled(c, answers[c.key]) ? <Text style={s.rowValue}>{rowAnswer(c, answers, schema)}</Text> : <Text style={[s.rowValue, s.empty]}>Not answered</Text>}
          </View>
        ))}
      </View>
    </View>
  );
}

const itemKey = (item: PrintItem) => (item.kind === "field" ? item.field.key : `row-${item.key}-${item.heading}`);

function Fields({ items, schema, answers }: { items: PrintItem[]; schema: WorksheetSchema; answers: Answers }) {
  return (
    <>
      {items.map((item) => (
        <PrintItemView key={itemKey(item)} item={item} schema={schema} answers={answers} />
      ))}
    </>
  );
}

/** Short enough to keep with its section heading on one page (a long answer is left free to break). */
function keepable(item: PrintItem | undefined, schema: WorksheetSchema, answers: Answers) {
  if (!item) return false;
  return item.kind === "row" || answerText(item.field, answers[item.field.key], schema).length <= 700;
}

function WorksheetPages({ input, generatedAt }: { input: WorksheetPdfInput; generatedAt: Date }) {
  const { schema, answers } = input;
  const words = schema.intro.title.trim().split(" ");
  const last = words.pop();
  return (
    <Page size="LETTER" style={s.page}>
      <Text style={s.brand}>The BOSS Business System</Text>
      <View style={s.rule} />
      {schema.intro.eyebrow ? <Text style={s.eyebrow}>{schema.intro.eyebrow}</Text> : null}
      <Text style={s.title}>
        {words.join(" ")} <Text style={s.titleLast}>{last}</Text>
      </Text>
      <Text style={s.meta}>
        {[input.memberName, input.completedAt ? `Completed ${dateFmt.format(new Date(input.completedAt))}` : "In progress", `Saved copy from ${dateFmt.format(generatedAt)}`].filter(Boolean).join("  ·  ")}
      </Text>
      {(input.topCallbacks ?? [])
        .filter((cb) => cb.text)
        .map((cb) => (
          <View key={cb.key} style={[s.quote, { marginTop: 22 }]} wrap={false}>
            <Text style={s.eyebrow}>{cb.heading}</Text>
            <Text style={s.quoteText}>{cb.text}</Text>
          </View>
        ))}
      {schema.sections.map((section) => {
        const items = printPlan(section.fields, schema, answers);
        // The heading, any quote and the first answer move to a new page together, so a heading never ends a page.
        const kept = keepable(items[0], schema, answers) ? items.slice(0, 1) : [];
        return (
          <View key={section.key}>
            <View style={s.section} wrap={false}>
              {section.number ? <Text style={s.number}>{section.number}</Text> : null}
              <View style={s.sectionBody}>
                {section.title ? <Text style={s.h2}>{section.title}</Text> : null}
                {section.ask ? <Text style={s.ask}>{section.ask}</Text> : null}
                {input.callbacks?.[section.key] ? (
                  <View style={s.quote}>
                    <Text style={s.eyebrow}>From {input.callbacks[section.key]!.label}</Text>
                    <Text style={s.quoteText}>{input.callbacks[section.key]!.text}</Text>
                  </View>
                ) : null}
                <Fields items={kept} schema={schema} answers={answers} />
              </View>
            </View>
            <View style={s.sectionRest}>
              <Fields items={items.slice(kept.length)} schema={schema} answers={answers} />
              {(section.subsections ?? []).map((sub) => {
                const subItems = printPlan(sub.fields, schema, answers, sub.title);
                const subKept = keepable(subItems[0], schema, answers) ? subItems.slice(0, 1) : [];
                return (
                  <View key={sub.key}>
                    <View wrap={false}>
                      {sub.title ? <Text style={s.h3}>{sub.title}</Text> : null}
                      <Fields items={subKept} schema={schema} answers={answers} />
                    </View>
                    <Fields items={subItems.slice(subKept.length)} schema={schema} answers={answers} />
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
      {schema.footer_note ? (
        <Text style={s.footerNote} wrap={false} minPresenceAhead={20}>
          {schema.footer_note}
        </Text>
      ) : null}
      <Text style={s.footerLeft} fixed>
        The BOSS Business System · Module {input.moduleNumber}
      </Text>
      <Text style={s.footerRight} fixed>
        {dateFmt.format(generatedAt)}
      </Text>
    </Page>
  );
}

export function worksheetPdfFilename(moduleNumber: number, lessonNumber?: number) {
  return lessonNumber ? `BOSS_Module${moduleNumber}_Lesson${lessonNumber}_Worksheet.pdf` : `BOSS_Module${moduleNumber}_Worksheets.pdf`;
}

/** One worksheet. */
export async function renderWorksheetPdf(input: WorksheetPdfInput, generatedAt = new Date()) {
  return renderWithFreshFonts(() => renderToBuffer(
    <Document title={`${input.schema.title}: worksheet`} author="The BOSS Business System" creator="The BOSS Business System">
      <WorksheetPages input={input} generatedAt={generatedAt} />
    </Document>,
  ));
}

/** Every completed worksheet in a module, in lesson order, each starting on a new page. */
export async function renderModuleWorksheetsPdf(inputs: WorksheetPdfInput[], moduleNumber: number, generatedAt = new Date()) {
  return renderWithFreshFonts(() => renderToBuffer(
    <Document title={`Module ${moduleNumber} worksheets`} author="The BOSS Business System" creator="The BOSS Business System">
      {inputs.map((input) => (
        <WorksheetPages key={input.schema.slug} input={input} generatedAt={generatedAt} />
      ))}
    </Document>,
  ));
}

/** Keys printed in the PDF, for tests. */
export function printedKeys(schema: WorksheetSchema, answers: Answers) {
  return schema.sections
    .flatMap((sec) => [...printPlan(sec.fields, schema, answers), ...(sec.subsections ?? []).flatMap((sub) => printPlan(sub.fields, schema, answers, sub.title))])
    .flatMap((item) => (item.kind === "field" ? [item.field.key] : item.fields.map((f) => f.key)));
}
