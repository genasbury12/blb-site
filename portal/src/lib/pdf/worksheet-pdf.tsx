import { Document, Font, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import {
  answerText,
  concreteFields,
  expandField,
  isFilled,
  isRequired,
  labelFrom,
  type Answers,
  type ConcreteField,
  type RatingAnswer,
  type SentenceAnswer,
  type WorksheetField,
  type WorksheetSchema,
} from "@/domain/worksheets/schema";

/**
 * Branded worksheet PDF (09_IMPLEMENT_WORKSHEETS, Slice C). Same approach as the audit PDF: PDF standard fonts
 * (Times for display, Helvetica for body) so rendering needs no network and never fails on a missing font file.
 * Built only from the member's saved answers; never logged.
 */
const C = { plum: "#65474F", ink: "#30282C", muted: "#5A4A50", mauve: "#A56C78", mauveInk: "#80505B", rose: "#E8C8CB", roseDeep: "#D4A5AB", ivory: "#F7EEE9", field: "#FBF6F3", fieldBorder: "#E6D9D9" };

// Break very long words (pasted links) so nothing runs past the page edge.
Font.registerHyphenationCallback((word) => (word.length > 28 ? (word.match(/.{1,20}/g) ?? [word]) : [word]));

const s = StyleSheet.create({
  page: { paddingTop: 48, paddingBottom: 64, paddingHorizontal: 54, backgroundColor: C.ivory, color: C.ink, fontFamily: "Helvetica", fontSize: 10, lineHeight: 1.45 },
  brand: { fontFamily: "Times-Roman", fontSize: 12, color: C.plum, letterSpacing: 0.4 },
  rule: { height: 1, backgroundColor: C.rose, marginVertical: 12 },
  eyebrow: { fontSize: 7.5, letterSpacing: 1.6, color: C.mauveInk, textTransform: "uppercase" },
  title: { fontFamily: "Times-Roman", fontSize: 30, marginTop: 6, lineHeight: 1.15 },
  titleLast: { fontFamily: "Times-Italic", color: C.mauve },
  meta: { fontSize: 8.5, color: C.muted, marginTop: 6 },
  section: { marginTop: 26, flexDirection: "row" },
  number: { fontFamily: "Times-Roman", fontSize: 30, color: C.roseDeep, width: 38, lineHeight: 1 },
  sectionBody: { flex: 1 },
  h2: { fontFamily: "Times-Roman", fontSize: 18, lineHeight: 1.2 },
  ask: { fontFamily: "Times-Italic", fontSize: 11.5, color: C.mauveInk, marginTop: 2 },
  h3: { fontFamily: "Times-Roman", fontSize: 14, marginTop: 14 },
  label: { fontFamily: "Helvetica-Bold", fontSize: 9, marginTop: 10, marginBottom: 3 },
  block: { backgroundColor: C.field, borderColor: C.fieldBorder, borderWidth: 1, borderRadius: 7, paddingVertical: 8, paddingHorizontal: 10 },
  empty: { fontFamily: "Helvetica-Oblique", color: C.muted },
  ratingWord: { fontFamily: "Helvetica-Bold" },
  sentence: { fontFamily: "Times-Roman", fontSize: 18, lineHeight: 1.35, color: C.plum },
  quote: { borderLeftColor: C.roseDeep, borderLeftWidth: 2, paddingLeft: 10, marginTop: 10 },
  quoteText: { fontFamily: "Times-Italic", fontSize: 13, color: C.plum },
  footer: { position: "absolute", bottom: 26, left: 54, right: 54, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: C.muted },
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
          <Text>{field.option_label_from ? labelFrom(field.option_label_from, value as string, answers) : (value as string)}</Text>
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

function Fields({ fields, schema, answers, context }: { fields: WorksheetField[]; schema: WorksheetSchema; answers: Answers; context?: string }) {
  return (
    <>
      {fields.flatMap((f) => {
        const group = f.repeat ? schema.repeat_groups?.[f.repeat] : undefined;
        return expandField(schema, f)
          // Repeat columns: print the ideas the member actually used (plus any required one).
          .filter((c) => !c.repeatKey || isRequired(c) || isFilled(c, answers[c.key]) || Boolean((answers[c.key] as RatingAnswer | undefined)?.rating))
          .map((c) => {
            const label = c.repeatKey ? `${context ? `${context}: ` : ""}${labelFrom(group?.label_from, c.repeatKey, answers)}` : (c.label ?? c.key);
            return (
              <View key={c.key} wrap={false}>
                <Text style={s.label}>{label}</Text>
                <Answer field={c} value={answers[c.key]} schema={schema} answers={answers} />
              </View>
            );
          });
      })}
    </>
  );
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
      {schema.sections.map((section) => (
        <View key={section.key} style={s.section}>
          {section.number ? <Text style={s.number}>{section.number}</Text> : null}
          <View style={s.sectionBody}>
            {section.title ? <Text style={s.h2}>{section.title}</Text> : null}
            {section.ask ? <Text style={s.ask}>{section.ask}</Text> : null}
            {input.callbacks?.[section.key] ? (
              <View style={s.quote} wrap={false}>
                <Text style={s.eyebrow}>From {input.callbacks[section.key]!.label}</Text>
                <Text style={s.quoteText}>{input.callbacks[section.key]!.text}</Text>
              </View>
            ) : null}
            <Fields fields={section.fields} schema={schema} answers={answers} />
            {(section.subsections ?? []).map((sub) => (
              <View key={sub.key}>
                {sub.title ? <Text style={s.h3}>{sub.title}</Text> : null}
                <Fields fields={sub.fields} schema={schema} answers={answers} context={sub.title} />
              </View>
            ))}
          </View>
        </View>
      ))}
      <View style={s.footer} fixed>
        <Text>The BOSS Business System · Module {input.moduleNumber}</Text>
        <Text render={({ pageNumber, totalPages }) => `${dateFmt.format(generatedAt)}  ·  Page ${pageNumber} of ${totalPages}`} />
      </View>
    </Page>
  );
}

export function worksheetPdfFilename(moduleNumber: number, lessonNumber?: number) {
  return lessonNumber ? `BOSS_Module${moduleNumber}_Lesson${lessonNumber}_Worksheet.pdf` : `BOSS_Module${moduleNumber}_Worksheets.pdf`;
}

/** One worksheet. */
export async function renderWorksheetPdf(input: WorksheetPdfInput, generatedAt = new Date()) {
  return renderToBuffer(
    <Document title={`${input.schema.title}: worksheet`} author="The BOSS Business System" creator="The BOSS Business System">
      <WorksheetPages input={input} generatedAt={generatedAt} />
    </Document>,
  );
}

/** Every completed worksheet in a module, in lesson order, each starting on a new page. */
export async function renderModuleWorksheetsPdf(inputs: WorksheetPdfInput[], moduleNumber: number, generatedAt = new Date()) {
  return renderToBuffer(
    <Document title={`Module ${moduleNumber} worksheets`} author="The BOSS Business System" creator="The BOSS Business System">
      {inputs.map((input) => (
        <WorksheetPages key={input.schema.slug} input={input} generatedAt={generatedAt} />
      ))}
    </Document>,
  );
}

/** Keys printed in the PDF, for tests. */
export function printedKeys(schema: WorksheetSchema, answers: Answers) {
  return concreteFields(schema)
    .filter((c) => !c.repeatKey || isRequired(c) || isFilled(c, answers[c.key]))
    .map((c) => c.key);
}
