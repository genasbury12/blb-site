import "server-only";
import type { ReportRun } from "@/components/audit/audit-report";
import { buildExportJson, buildExportZip, exportFilename, safeName, type ExportAudience, type ExportFile, type ExportRaw } from "@/domain/data-export/build";
import { answerText, findField, worksheetSchemaSchema, type Answers, type WorksheetSchema } from "@/domain/worksheets/schema";
import { renderAuditReportPdf } from "@/lib/pdf/audit-report-pdf";
import { renderWorksheetPdf, worksheetPdfFilename } from "@/lib/pdf/worksheet-pdf";
import { logEvent } from "@/lib/observability";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * 10_DATA_RIGHTS Slice A: build one member's "Download all my data" ZIP in memory. Never stored.
 *
 * Call only after the route has authorized the request (the member themselves, or an admin) and started the export
 * with start_data_export. Reads with the service role so a member whose access has ended still gets everything,
 * including worksheets on lessons they can no longer open. Every personal query is filtered to this one member's id;
 * reference rows (lesson titles, worksheet schemas, the coach's name) are looked up by the ids those rows contain.
 * Logs counts and sizes only, never content.
 */

type Admin = ReturnType<typeof createSupabaseAdminClient>;
type Row = Record<string, unknown>;

async function rows(q: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<Row[]> {
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Row[];
}

const ids = (list: Row[], key: string) => [...new Set(list.map((r) => r[key]).filter(Boolean) as string[])];

async function download(db: Admin, bucket: string, key: string): Promise<Uint8Array | null> {
  const { data, error } = await db.storage.from(bucket).download(key);
  if (error || !data) return null;
  return new Uint8Array(await data.arrayBuffer());
}

async function collect(db: Admin, userId: string, generatedAt: string): Promise<ExportRaw & { worksheetRows: Row[] }> {
  const [authUser, profile, orders, subscriptions, entitlements, lessonProgress, milestoneProgress, auditRuns, auditDrafts, roadmapItems, pathChoices, responses, questions, hotSeat, feedback, posts, comments, reports, eliteApps, assignments, boards] =
    await Promise.all([
      db.auth.admin.getUserById(userId),
      db.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      rows(db.from("orders").select("*").eq("user_id", userId).order("created_at")),
      rows(db.from("subscriptions").select("*").eq("user_id", userId).order("created_at")),
      rows(db.from("entitlements").select("*").eq("user_id", userId).order("starts_at")),
      rows(db.from("lesson_progress").select("lesson_id, completed_at").eq("user_id", userId).order("completed_at")),
      rows(db.from("milestone_progress").select("*").eq("user_id", userId)),
      rows(db.from("audit_runs").select("*").eq("user_id", userId).order("submitted_at")),
      rows(db.from("audit_drafts").select("*").eq("user_id", userId)),
      rows(db.from("roadmap_items").select("*").eq("user_id", userId).order("month_number")),
      rows(db.from("path_overrides").select("*").eq("user_id", userId).order("created_at")),
      rows(db.from("worksheet_responses").select("*").eq("user_id", userId).order("created_at")),
      rows(db.from("coaching_questions").select("*").eq("user_id", userId).order("created_at")),
      rows(db.from("hotseat_applications").select("*").eq("user_id", userId).order("created_at")),
      rows(db.from("feedback_submissions").select("*").eq("user_id", userId).order("created_at")),
      rows(db.from("community_posts").select("*").eq("user_id", userId).order("created_at")),
      rows(db.from("community_comments").select("*").eq("user_id", userId).order("created_at")),
      rows(db.from("community_reports").select("*").eq("reporter_id", userId).order("created_at")),
      rows(db.from("elite_applications").select("*").eq("user_id", userId).order("created_at")),
      rows(db.from("coach_assignments").select("coach_id").eq("student_id", userId)),
      rows(db.from("elite_boards").select("*").eq("client_id", userId)),
    ]);
  if (profile.error) throw new Error(profile.error.message);

  const orderIds = ids(orders, "id");
  const board = boards[0] ?? null;
  const boardId = board?.id as string | undefined;
  const wsKeys = responses.map((r) => ({ slug: r.worksheet_slug as string, version: r.worksheet_version as number }));
  const coachIds = [...ids(assignments, "coach_id"), ...(board?.coach_id ? [board.coach_id as string] : [])];

  const [payments, coaches, worksheetRows, milestones, eliteItems, eliteSessions, eliteCheckins, eliteBuckets, eliteTime, eliteFiles] = await Promise.all([
    orderIds.length ? rows(db.from("order_payments").select("*").in("order_id", orderIds).order("created_at")) : [],
    coachIds.length ? rows(db.from("profiles").select("user_id, display_name").in("user_id", coachIds)) : [],
    wsKeys.length ? rows(db.from("worksheets").select("slug, version, title, schema, lesson_id, status").in("slug", ids(responses, "worksheet_slug"))) : [],
    milestoneProgress.length ? rows(db.from("milestones").select("id, module_id, title").in("id", ids(milestoneProgress, "milestone_id"))) : [],
    boardId ? rows(db.from("elite_items").select("*").eq("board_id", boardId).order("created_at")) : [],
    boardId ? rows(db.from("elite_sessions").select("*").eq("board_id", boardId).order("starts_at")) : [],
    boardId ? rows(db.from("elite_checkins").select("*").eq("board_id", boardId).order("due_at")) : [],
    boardId ? rows(db.from("elite_hour_buckets").select("*").eq("board_id", boardId).order("starts_at")) : [],
    boardId ? rows(db.from("elite_time_entries").select("*").eq("board_id", boardId).order("work_date")) : [],
    boardId ? rows(db.from("elite_files").select("*").eq("board_id", boardId).order("created_at")) : [],
  ]);
  const itemIds = ids(eliteItems, "id");
  const eliteComments = itemIds.length ? await rows(db.from("elite_item_comments").select("*").in("item_id", itemIds).order("created_at")) : [];

  const lessonIds = [...ids(lessonProgress, "lesson_id"), ...ids(worksheetRows, "lesson_id")];
  const lessons = lessonIds.length ? await rows(db.from("lessons").select("id, module_id, order_index, title").in("id", lessonIds)) : [];
  const moduleIds = [...ids(lessons, "module_id"), ...ids(milestones, "module_id")];
  const modules = moduleIds.length ? await rows(db.from("modules").select("id, number, title").in("id", moduleIds)) : [];

  const assigned = ids(assignments, "coach_id")[0] ?? (board?.coach_id as string | undefined);
  return {
    generatedAt,
    email: authUser.data.user?.email ?? null,
    profile: (profile.data as Row | null) ?? null,
    coachName: assigned ? ((coaches.find((c) => c.user_id === assigned)?.display_name as string | null) ?? "Your coach") : null,
    orders,
    payments,
    subscriptions,
    entitlements,
    modules: modules as ExportRaw["modules"],
    lessons: lessons as ExportRaw["lessons"],
    milestones: milestones as ExportRaw["milestones"],
    lessonProgress: lessonProgress as ExportRaw["lessonProgress"],
    milestoneProgress,
    auditRuns,
    auditDrafts,
    roadmapItems,
    pathChoices,
    worksheets: worksheetRows.map((w) => ({ slug: w.slug as string, version: w.version as number, title: w.title as string })),
    worksheetResponses: responses,
    coachingQuestions: questions,
    hotSeatApplications: hotSeat,
    feedback,
    communityPosts: posts,
    communityComments: comments,
    communityReports: reports,
    eliteApplications: eliteApps,
    eliteBoard: board,
    eliteItems,
    eliteItemComments: eliteComments,
    eliteSessions,
    eliteCheckins,
    eliteHourBuckets: eliteBuckets,
    eliteTimeEntries: eliteTime,
    eliteFiles,
    worksheetRows,
  };
}

/** PDFs of completed worksheets, built from the response's own worksheet version (works after access ends). */
async function worksheetPdfs(raw: ExportRaw & { worksheetRows: Row[] }, memberName: string | null): Promise<(ExportFile & { source: string })[]> {
  const schemaOf = new Map<string, WorksheetSchema>();
  for (const w of raw.worksheetRows) {
    const parsed = worksheetSchemaSchema.safeParse(w.schema);
    if (parsed.success) schemaOf.set(`${w.slug}@${w.version}`, parsed.data);
  }
  // For callbacks: the source worksheet's published version, otherwise its newest one.
  const latestSchema = (slug: string) => {
    const versions = raw.worksheetRows.filter((w) => w.slug === slug).sort((a, b) => (b.status === "published" ? 1 : 0) - (a.status === "published" ? 1 : 0) || (b.version as number) - (a.version as number));
    return versions[0] ? schemaOf.get(`${slug}@${versions[0].version}`) : undefined;
  };
  const answersOf = new Map(raw.worksheetResponses.map((r) => [r.worksheet_slug as string, (r.answers ?? {}) as Answers]));
  const lessonOf = new Map(raw.lessons.map((l) => [l.id, l]));
  const moduleOf = new Map(raw.modules.map((m) => [m.id, m]));
  const out: (ExportFile & { source: string })[] = [];
  for (const r of raw.worksheetResponses.filter((x) => x.status === "complete")) {
    const row = raw.worksheetRows.find((w) => w.slug === r.worksheet_slug && w.version === r.worksheet_version);
    const schema = schemaOf.get(`${r.worksheet_slug}@${r.worksheet_version}`);
    const lesson = row ? lessonOf.get(row.lesson_id as string) : undefined;
    const mod = lesson ? moduleOf.get(lesson.module_id) : undefined;
    if (!schema || !lesson || !mod) continue;
    const callbacks: Record<string, { label: string; text: string }> = {};
    for (const section of schema.sections) {
      const cb = section.callback;
      const src = cb ? latestSchema(cb.worksheet) : undefined;
      const answers = cb ? answersOf.get(cb.worksheet) : undefined;
      if (!cb || !src || !answers) continue;
      const text = answerText(findField(src, cb.field), answers[cb.field], src).trim();
      if (text) callbacks[section.key] = { label: cb.label ?? src.title, text };
    }
    try {
      const pdf = await renderWorksheetPdf({
        schema,
        answers: (r.answers ?? {}) as Answers,
        moduleNumber: mod.number,
        lessonNumber: lesson.order_index,
        memberName,
        completedAt: (r.completed_at as string | null) ?? null,
        callbacks,
      });
      out.push({ path: `worksheets/${worksheetPdfFilename(mod.number, lesson.order_index)}`, bytes: new Uint8Array(pdf), source: `worksheet ${r.worksheet_slug}` });
    } catch {
      logEvent("error", "data export worksheet pdf failed", { slug: r.worksheet_slug as string });
    }
  }
  return out;
}

async function uploads(db: Admin, raw: ExportRaw, audience: ExportAudience): Promise<(ExportFile & { source: string })[]> {
  const privateItems = audience === "admin" ? new Set<string>() : new Set(raw.eliteItems.filter((i) => i.kind === "coach_note").map((i) => i.id as string));
  const wanted: { bucket: string; key: string; path: string; source: string }[] = [
    ...raw.milestoneProgress
      .filter((p) => p.evidence_storage_key)
      .map((p) => ({ bucket: "student-evidence", key: p.evidence_storage_key as string, path: `uploads/milestone-evidence/${safeName(p.evidence_storage_key as string, "evidence")}`, source: `milestone evidence ${p.milestone_id}` })),
    ...raw.feedback
      .filter((f) => f.file_key)
      .map((f) => ({ bucket: "feedback-files", key: f.file_key as string, path: `uploads/feedback/${safeName(f.file_key as string, "file")}`, source: `feedback ${f.id}` })),
    ...raw.eliteFiles
      .filter((f) => f.storage_key && !privateItems.has(f.item_id as string))
      .map((f) => ({ bucket: "elite-files", key: f.storage_key as string, path: `uploads/elite/${safeName((f.label as string) || (f.storage_key as string), "file")}${extOf(f.storage_key as string, f.label as string)}`, source: `elite file ${f.id}` })),
  ];
  const out: (ExportFile & { source: string })[] = [];
  for (const w of wanted) {
    const bytes = await download(db, w.bucket, w.key);
    if (bytes) out.push({ path: w.path, bytes, source: w.source });
    else logEvent("warn", "data export file missing", { bucket: w.bucket });
  }
  return out;
}

/** Add the stored file's extension when the label has none (labels are free text). */
function extOf(key: string, label: string | undefined) {
  const ext = key.match(/\.[a-z0-9]{2,5}$/i)?.[0] ?? "";
  return label && /\.[a-z0-9]{2,5}$/i.test(label) ? "" : ext;
}

export async function buildMemberExport(userId: string, audience: ExportAudience = "member", exportedBy?: string): Promise<{ zip: Uint8Array; filename: string; fileCount: number }> {
  const db = createSupabaseAdminClient();
  const generatedAt = new Date().toISOString();
  const raw = await collect(db, userId, generatedAt);
  const memberName = (raw.profile?.display_name as string | null) ?? null;

  const files = [...(await worksheetPdfs(raw, memberName)), ...(await uploads(db, raw, audience))];
  const latestRun = raw.auditRuns.at(-1);
  if (latestRun) {
    try {
      files.push({ path: "audit-report.pdf", bytes: new Uint8Array(await renderAuditReportPdf(latestRun as unknown as ReportRun, memberName)), source: "latest business audit report" });
    } catch {
      logEvent("error", "data export audit pdf failed", {});
    }
  }

  const json = buildExportJson(raw, files.map((f) => ({ path: f.path, source: f.source })), audience, exportedBy);
  const zip = buildExportZip(json, generatedAt, files, audience, exportedBy);
  logEvent("info", "data export built", { files: files.length + 2, bytes: zip.byteLength });
  return { zip, filename: exportFilename(generatedAt), fileCount: files.length + 2 };
}
