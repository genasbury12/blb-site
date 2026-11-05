import {
  answerText,
  choiceOptions,
  concreteFields,
  isFilled,
  type Answers,
  type ConcreteField,
  type RatingAnswer,
  type SentenceAnswer,
  type WorksheetField,
  type WorksheetSchema,
} from "./schema";

/**
 * Staff views of worksheet answers (09_IMPLEMENT_WORKSHEETS, Slice D): the admin table columns, rating counts and
 * the CSV export. Pure functions so they are tested without a database.
 */

export type ResponseRow = {
  id: string;
  name: string;
  email: string | null;
  status: "in_progress" | "complete";
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
  answers: Answers;
};

/** A schema field plus the heading it sits under (repeat fields have no label of their own). */
function fieldsWithContext(schema: WorksheetSchema) {
  const out: { field: WorksheetField; context: string | undefined }[] = [];
  for (const s of schema.sections) {
    for (const f of s.fields) out.push({ field: f, context: s.title });
    for (const sub of s.subsections ?? []) for (const f of sub.fields) out.push({ field: f, context: sub.title ?? s.title });
  }
  return out;
}

export type AdminColumn = {
  /** As written in `admin_columns`, e.g. "cred_{chosen}". */
  spec: string;
  header: string;
  type: WorksheetField["type"];
};

const TOKEN = /\{([a-z0-9_]+)\}/i;

/** Columns named by the schema's `admin_columns`; "{chosen}" style tokens resolve per response. */
export function adminColumns(schema: WorksheetSchema): AdminColumn[] {
  const all = fieldsWithContext(schema);
  return (schema.admin_columns ?? []).flatMap((spec) => {
    const token = spec.match(TOKEN)?.[1];
    const baseKey = token ? spec.replace(TOKEN, "{k}") : spec;
    const hit = all.find(({ field }) => field.key === baseKey) ?? all.find(({ field }) => !field.repeat && field.key === spec);
    if (!hit) {
      // A single row of a repeat group, e.g. "theme_1" (Lesson 3): its own label, "Problem 1".
      const concrete = concreteFields(schema).find((f) => f.key === spec);
      return concrete ? [{ spec, header: concrete.label ?? spec, type: concrete.type }] : [];
    }
    const label = hit.field.label ?? hit.context ?? baseKey;
    return [{ spec, header: token ? `${label} (${token})` : label, type: hit.field.type }];
  });
}

/** The concrete field key a column points at for one response, or null when its token is unanswered. */
export function resolveColumnKey(spec: string, answers: Answers): string | null {
  const token = spec.match(TOKEN)?.[1];
  if (!token) return spec;
  const v = answers[token];
  return typeof v === "string" && v.trim() ? spec.replace(TOKEN, v.trim()) : null;
}

export type AdminCell = { kind: "rating"; rating: string | null; label: string; note: string } | { kind: "text"; text: string };

export function adminCell(schema: WorksheetSchema, spec: string, answers: Answers): AdminCell {
  const key = resolveColumnKey(spec, answers);
  const field = key ? concreteFields(schema).find((f) => f.key === key) : undefined;
  if (!key || !field) return { kind: "text", text: "" };
  const value = answers[key];
  if (field.type === "rating") {
    const r = (value as RatingAnswer | undefined) ?? { rating: null, note: "" };
    const label = schema.rating_options?.find((o) => o.value === r.rating)?.label ?? "";
    return { kind: "rating", rating: r.rating ?? null, label, note: (r.note ?? "").trim() };
  }
  if (field.type === "choice" && typeof value === "string" && field.option_label_from) {
    const named = answers[field.option_label_from.replace("{k}", value)];
    return { kind: "text", text: typeof named === "string" && named.trim() ? `${value}: ${named.trim()}` : value };
  }
  return { kind: "text", text: answerText(field, value, schema) };
}

/** For each rating column, how many responses rated it Weak (brief: counts at top). */
export function weakCounts(schema: WorksheetSchema, rows: Pick<ResponseRow, "answers">[]) {
  return adminColumns(schema)
    .filter((c) => c.type === "rating")
    .map((c) => ({
      header: c.header,
      weak: rows.filter((r) => {
        const cell = adminCell(schema, c.spec, r.answers);
        return cell.kind === "rating" && cell.rating === "weak";
      }).length,
    }));
}

export type AdminCount = { label: string; value: string; hint: string };

/**
 * The schema's admin_counts as tiles (brief 11). count_filled: how many rows each member filled (e.g. observations
 * logged), shown as the total with the per member spread. tally: how often each option of a choice field was picked
 * across every row and member, in the option list's order ("12 / 9 / 4").
 */
export function adminCounts(schema: WorksheetSchema, rows: Pick<ResponseRow, "answers">[]): AdminCount[] {
  const fields = concreteFields(schema);
  return (schema.admin_counts ?? []).flatMap((spec) => {
    if (spec.count_filled) {
      const matching = fields.filter((f) => f.baseKey === spec.count_filled || f.key === spec.count_filled);
      const perMember = rows.map((r) => matching.filter((f) => isFilled(f, r.answers[f.key])).length);
      const total = perMember.reduce((a, b) => a + b, 0);
      const [lo, hi] = [Math.min(...perMember), Math.max(...perMember)];
      const hint = !perMember.length ? "No responses yet" : lo === hi ? `${lo} per member` : `${lo} to ${hi} per member`;
      return [{ label: spec.label, value: String(total), hint }];
    }
    const matching = fields.filter((f) => f.baseKey === spec.tally || f.key === spec.tally);
    const first = matching[0];
    if (!first || first.type !== "choice") return [];
    const options = choiceOptions(schema, first);
    const tally = options.map((o) => rows.reduce((n, r) => n + matching.filter((f) => r.answers[f.key] === o.value).length, 0));
    return [{ label: spec.label, value: tally.join(" / "), hint: options.map((o, i) => `${o.label} ${tally[i]}`).join(", ") }];
  });
}

// ---------------------------------------------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------------------------------------------

/** RFC 4180 quoting, plus a leading apostrophe on values a spreadsheet would run as a formula. */
export function csvCell(v: string | null | undefined): string {
  let s = v ?? "";
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csvColumns(field: ConcreteField): string[] {
  return field.type === "rating" ? [`${field.key}_rating`, `${field.key}_note`] : [field.key];
}

function csvValues(field: ConcreteField, answers: Answers): string[] {
  const value = answers[field.key];
  if (field.type === "rating") {
    const r = value as RatingAnswer | undefined;
    return [r?.rating ?? "", r?.note ?? ""];
  }
  if (field.type === "sentence") {
    const s = value as SentenceAnswer | undefined;
    const filled = s && Object.entries(s).some(([k, v]) => k !== "_rendered" && typeof v === "string" && v.trim());
    return [filled ? (s._rendered ?? "") : ""];
  }
  if (field.type === "multichoice") return [Array.isArray(value) ? value.join(", ") : ""];
  return [typeof value === "string" ? value : ""];
}

const FIXED = ["name", "email", "status", "started_at", "updated_at", "completed_at"];

export type ExportStamp = { by: string; at: Date };

/** The traceability line at the top of an admin export (10_DATA_RIGHTS Slice D). */
export function exportStampLine(stamp: ExportStamp) {
  const day = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York", timeZoneName: "short" }).format(stamp.at);
  return `Exported by ${stamp.by} on ${day} from The BOSS Business System. Member answers are private.`;
}

/**
 * Every response flattened to one column per field key (rating as _rating and _note; sentence as its text). With a
 * stamp, the first line says who exported it and when, so a leaked file can be traced; the column headers follow.
 */
export function worksheetCsv(schema: WorksheetSchema, rows: ResponseRow[], stamp?: ExportStamp): string {
  const fields = concreteFields(schema);
  const header = [...FIXED, ...fields.flatMap(csvColumns)];
  const lines = [...(stamp ? [csvCell(exportStampLine(stamp))] : []), header.map(csvCell).join(",")];
  for (const r of rows) {
    const fixed = [r.name, r.email ?? "", r.status, r.startedAt, r.updatedAt, r.completedAt ?? ""];
    lines.push([...fixed, ...fields.flatMap((f) => csvValues(f, r.answers))].map(csvCell).join(","));
  }
  // Byte order mark so Excel reads UTF-8; CRLF per RFC 4180.
  return `﻿${lines.join("\r\n")}\r\n`;
}

export function worksheetCsvFilename(slug: string, now = new Date()) {
  return `${slug.replace(/[^a-z0-9-]/gi, "-")}_responses_${now.toISOString().slice(0, 10)}.csv`;
}
